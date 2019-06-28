import { get } from 'lodash';
import {
  GLOBAL_COURSE_ID,
  learningObjectiveQuizReportThreshHolds,
  learningObjectiveRecommendationTexts,
  PUBLISHED,
} from '../../../../../../constants';
import {
  ComponentLockedError,
  DatabaseRecordNotFoundError, UnauthenticatedUserError,
} from '../../../../../../constants/errors';
import callGraphqlApi from '../../../../../api/callGraphqlApi';
import getUserIdandAppNameAfterValidation
  from '../../../preHookFunctions/validation/utils/getUserIdandAppNameAfterValidation';
import validateCurrentTopicComponent from '../../utils/validateCurrentTopicComponent';

// query to get current component status of user
const getUserCurrentTopicComponentStatus = userId => `
  query{
    userCurrentTopicComponentStatuses(filter:{
      and:[
        {user_some:{
        id:"${userId}"
        }},
      {currentCourse_some:{
        and:[
          {status: ${PUBLISHED}},
          {id:"${GLOBAL_COURSE_ID}"}
        ]
      }}
      ]
    }){
      id
      currentTopic{
        id
        order
      }
      currentLearningObjective{
        id
        order
      }
      currentTopicComponentType
      enrollmentType
    }
  }
  `;

// query to get topic and it's order
const getTopicQuery = topicId => `
  query{
    topic(id:"${topicId}"){
      id
      order
      title
    }
  }
  `;

// query to get user quiz report of a topic
const getQuizReportQuery = (userId, topicId) => `
  query{
    userQuizReports(
      filter:{
      and:[
        {
          user_some:{
            id: "${userId}"
          }
        },
        {
          topic_some:{
            id:"${topicId}"
          }
        }
      ]
    }
    orderBy: createdAt_DESC
    ){
      id
      quizReport {
        totalQuestionCount
        correctQuestionCount
        inCorrectQuestionCount
        unansweredQuestionCount
        masteryLevel
      }
      learningObjectiveReport {
        learningObjective {
          id
          order
          title
        }
        totalQuestionCount
        correctQuestionCount
        inCorrectQuestionCount
        unansweredQuestionCount
      }
      quizAnswers {
        isAttempted
        isCorrect
        question {
          id
          statement
          questionType
          hint
          codeSnippet
        }
        mcqOptions {
          isCorrect
          statement
        }
        userMcqAnswer {
          isSelected
          statement
        }
        fibInputOptions {
          answers
          correctPosition
        }
        userFibInputAnswer {
          answer
          position
        }
        fibBlocksOptions {
          correctPositions
          statement
        }
        userFibBlockAnswer {
          statement
          position
        }
        arrangeOptions {
          displayOrder
          correctPosition
          statement
        }
        userArrangeAnswer {
          statement
          position
        }
      }
    }
  }
  `;

/*
  parsing data of user quiz report so that the logic implemented ahead can read data in
  desired format and return the same.
  Example: suppose client has asked for title and order of topic,
  In that case he will get title and order only. And this is happening when we parse
  data as below. If parsing is not done, it is returning empty data.
  Also evaluating recommendation text on basis of correct/total ques percentage for LO
  */
const parseQuizReport = async (
  quizReport,
) => {
  const { familiar, master } = learningObjectiveQuizReportThreshHolds;
  const { familiar: familiarText, master: masterText, proficient: proficientText } =
    learningObjectiveRecommendationTexts;
  if (quizReport.learningObjectiveReport
    && quizReport.learningObjectiveReport.length) {
    quizReport.learningObjectiveReport.forEach((loReport, index) => {
      let loRecommendationText = '';
      let percentage = 0;
      Object.assign(quizReport.learningObjectiveReport[index].learningObjective, { type: 'LearningObjective', typeId: `${loReport.learningObjective.id}` });
      if (loReport.totalQuestionCount > 0) {
        percentage = (loReport.correctQuestionCount / loReport.totalQuestionCount) * 100;
      }
      if (percentage >= master) {
        loRecommendationText = proficientText;
      } else if (percentage < master && percentage > familiar) {
        loRecommendationText = masterText;
      } else {
        loRecommendationText = familiarText;
      }
      Object.assign(quizReport.learningObjectiveReport[index],
        { recommendationText: loRecommendationText });
    });
  }
  if (quizReport.quizAnswers
    && quizReport.quizAnswers.length) {
    quizReport.quizAnswers.forEach((quizAnswer, index) => {
      Object.assign(quizReport.quizAnswers[index].question, { type: 'QuestionBank', typeId: `${quizAnswer.question.id}` });
    });
  }
  return quizReport;
};

/*
This is called when user tries goes to quiz report page
It will return the first and last quiz report of the user
based on User current topic component status which will be used to check
whther user has attempted quiz or not
It also returns the answers given by the user for that in respective attempt
*/
const userFirstAndLatestQuizReportMutationResolver = async (
  root,
  input,
  typeName,
  info,
  mutationName,
  ast,
  context,
  params,
) => {
  /*
  Calling method to validate token and return userId.
  */
  const userAndAppInfo = getUserIdandAppNameAfterValidation(context, true);
  const {
    userIdFromContext: userId,
  } = userAndAppInfo;
  const { topicId } = params;
  if (!topicId) {
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'topicId is not present',
      },
    });
  }

  if (!userId) {
    throw new UnauthenticatedUserError();
  }

  const { authorization: token } = context;
  const res = await callGraphqlApi(
    getUserCurrentTopicComponentStatus(userId),
    '',
    '',
    '',
    token,
  );

  const currentTopicComponentInfo = get(res, 'data.userCurrentTopicComponentStatuses[0]');

  // calling method to validate user current topic component status
  validateCurrentTopicComponent(currentTopicComponentInfo, mutationName);

  // calling API to get data of fetched topic
  const topicRes = await callGraphqlApi(
    getTopicQuery(topicId),
    '',
    '',
    '',
    token,
  );
  // getting info of called topic
  const topicInfo = get(topicRes, 'data.topic');
  if (!topicInfo) {
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'Topic is not present',
      },
    });
  }
  const {
    currentTopic: currentRunningTopic,
  } = currentTopicComponentInfo;
  if (topicInfo.order >= currentRunningTopic.order) {
    throw new ComponentLockedError();
  }
  // this object will be returned in output
  const userQuizReportData = {};
  const quizData = [];
  let parsedLatestQuizReport;
  let parsedFirstQuizReport;
  const quizRes = await callGraphqlApi(
    getQuizReportQuery(userId, topicId),
    '',
    '',
    '',
    token,
  );
  const quizInfo = get(quizRes, 'data.userQuizReports');
  // Constructing data for first and latest quiz report
  if (quizInfo.length) {
    const latestQuizReport = quizInfo[0];
    parsedLatestQuizReport = parseQuizReport(latestQuizReport, quizData);
    parsedLatestQuizReport.quizReportNumber = 'latest';
    if (quizInfo.length > 1) {
      const firstQuizReport = quizInfo[quizInfo.length - 1];
      parsedFirstQuizReport = parseQuizReport(firstQuizReport, quizData);
      parsedFirstQuizReport.quizReportNumber = 'first';
    }
  }
  // parsing data for topic
  const topicData = { type: 'Topic', typeId: `${topicInfo.id}` };
  // parsing data for user
  const userData = { type: 'User', typeId: `${userId}` };
  // Constructing data as per schema
  Object.assign(userQuizReportData, {
    topic: topicData,
    user: userData,
    firstQuizReport: parsedFirstQuizReport,
    latestQuizReport: parsedLatestQuizReport,
  });

  return userQuizReportData;
};

export default userFirstAndLatestQuizReportMutationResolver;

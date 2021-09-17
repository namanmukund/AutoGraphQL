import { get } from 'lodash';
import {
  GLOBAL_COURSE_TITLE,
  learningObjectiveQuizReportThreshHolds,
  learningObjectiveRecommendationTexts,
  PUBLISHED,
  masteryLevels,
  topicTypes,
  userActionType,
} from '../../../../../../constants';
import {
  ComponentLockedError,
  DatabaseRecordNotFoundError, UnauthenticatedUserError,
} from '../../../../../../constants/errors';
import callGraphqlApi from '../../../../../api/callGraphqlApi';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import getUserIdandAppNameAfterValidation
  from '../../../preHookFunctions/validation/utils/getUserIdandAppNameAfterValidation';
import validateCurrentTopicComponent from '../../utils/validateCurrentTopicComponent';
import { log } from '../../../../../../utils';

// query to get current component status of user
const getUserCurrentTopicComponentStatus = (userId) => `
  query{
    userCurrentTopicComponentStatuses(filter:{
      and:[
        {user_some:{
        id:"${userId}"
        }},
      {currentCourse_some:{
        and:[
          {status: ${PUBLISHED}},
          {title: "${GLOBAL_COURSE_TITLE}"}
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
const getTopicQuery = (topicId) => `
  query{
    topic(id:"${topicId}"){
      id
      order
      title
    }
  }
  `;

// query to get user quiz to get next component
const userQuizQuery = (userId, topicId, courseId) => `
  query{
    userQuizs(
      filter: {
        and: [
          { user_some: { id: "${userId}" } }
          { topic_some: { id: "${topicId}" } }
          ${courseId ? `{course_some:{id:"${courseId}"}},` : ''}
        ]
      }
      orderBy: createdAt_DESC
      first: 1
    ){
      id
      quiz{
        question{
          id
        }
      }
      nextComponent {
        topic {
            id
        }
      }
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
    }
  }
  `;

// mutation to add UserQuizReport
const addUserQuizDump = (
  userId,
  topicId,
  courseId,
) => `
  mutation addQuizDump($input: [QuizQuestionsTypeInput]!){
    addUserActivityQuizDump(
    userConnectId: "${userId}",
    topicConnectId: "${topicId}",
    ${courseId ? `courseConnectId: "${courseId}",` : ''}
    input: {
      quizAction: ${userActionType.next},
       quizQuestions: $input
    }) {
      id
      quizReportId
    }
  }
  `;

// query to get batch status
const getBatchStatus = (userId) => `
  query{
    user(id: "${userId}"){
      studentProfile{
        batch{
          id
          type
          currentComponent{
            currentCourse{
              id
              order
            }
            currentTopic{
              id
              order
            }
            latestSessionStatus
          }
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
  const {
    familiar: familiarPercentage,
    master: masterPercentage,
    proficient: proficientPercentage,
  } = learningObjectiveQuizReportThreshHolds;
  const {
    learningObjectiveDefaultText,
    learningObjectiveFamiliarText,
    learningObjectiveMasterText,
    learningObjectiveProficientText,
  } = learningObjectiveRecommendationTexts;
  const {
    familiar, master, proficient, defaultMastery,
  } = masteryLevels;
  if (quizReport.learningObjectiveReport
    && quizReport.learningObjectiveReport.length) {
    quizReport.learningObjectiveReport.forEach((loReport, index) => {
      let loRecommendationText = '';
      let masteryLevelText = '';
      let percentage = 0;
      Object.assign(quizReport.learningObjectiveReport[index].learningObjective, { type: 'LearningObjective', typeId: `${loReport.learningObjective.id}` });
      if (loReport.totalQuestionCount > 0) {
        percentage = (loReport.correctQuestionCount / loReport.totalQuestionCount) * 100;
      }
      if (percentage === proficientPercentage) {
        loRecommendationText = learningObjectiveProficientText;
        masteryLevelText = proficient;
      } else if (percentage >= masterPercentage) {
        loRecommendationText = learningObjectiveMasterText;
        masteryLevelText = master;
      } else if (percentage < masterPercentage && percentage >= familiarPercentage) {
        loRecommendationText = learningObjectiveFamiliarText;
        masteryLevelText = familiar;
      } else {
        loRecommendationText = learningObjectiveDefaultText;
        masteryLevelText = defaultMastery;
      }
      Object.assign(quizReport.learningObjectiveReport[index],
        {
          recommendationText: loRecommendationText,
          masteryLevel: masteryLevelText,
        });
    });
  }
  if (quizReport.id) {
    Object.assign(quizReport, {
      quizReportId: quizReport.id,
    });
  }
  return quizReport;
};

/*
This is called when user submits a quiz.
It will return the latest and first quiz report of the user
based on User current topic component status which will be used to check
whether user has attempted quiz or not
*/
const getQuizReportMutationResolver = async (
  root,
  input,
  typeName,
  info,
  mutationName,
  ast,
  context,
) => {
  /*
  Calling method to validate token and return userId.
  */
  const userAndAppInfo = getUserIdandAppNameAfterValidation(context, true);
  const {
    userIdFromContext: userId,
  } = userAndAppInfo;
  if (!userId) {
    throw new UnauthenticatedUserError();
  }

  const { topicId, quizQuestions, courseId } = input;
  if (!topicId) {
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'topicId is not present',
      },
    });
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

  // checking if user belongs to a batch if he does everthing will be calculated on basis of batch
  const batchRes = await callLocalGraphqlApi(
    getBatchStatus(userId),
    context,
    '',
  );

  const batchCurrentComponentInfo = get(batchRes, 'data.user.studentProfile.batch.currentComponent');

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
  let currentRunningTopic;

  // if user belongs to a batch, quiz report will be calculated on basis of batchCurrentComponentStatus
  if (batchCurrentComponentInfo) {
    currentRunningTopic = batchCurrentComponentInfo && batchCurrentComponentInfo.currentTopic;
  } else {
    currentRunningTopic = currentTopicComponentInfo && currentTopicComponentInfo.currentTopic;
  }

  if (topicInfo.order > currentRunningTopic.order) {
    throw new ComponentLockedError();
  }
  const userQuizQueryRes = await callGraphqlApi(userQuizQuery(userId, topicId, courseId));
  const userQuizInfo = get(userQuizQueryRes, 'data.userQuizs[0]');
  const quizQuestionsInUserQuiz = get(userQuizInfo, 'quiz');
  if (!quizQuestionsInUserQuiz
    || !quizQuestionsInUserQuiz.length) {
    log('Quiz Questions are not present in UserQuiz in getQuizReport');
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'Topic.QuizQuestions: is not present',
      },
    });
  }

  /*
  Sending and awaiting user quiz dump
  This is called beforehand so that the userQuizReport document gets created for just sent quiz data
  */
  await callGraphqlApi(
    addUserQuizDump(userId, topicId, courseId),
    {
      input: quizQuestions,
    },
    '',
    '',
    token,
  );

  // Constructing data for first and latest quiz report
  let parsedFirstQuizReport;
  let parsedLatestQuizReport;
  const quizRes = await callGraphqlApi(
    getQuizReportQuery(userId, topicId),
    '',
    '',
    '',
    token,
  );
  // Constructing data for first and latest quiz report
  const quizInfo = get(quizRes, 'data.userQuizReports');
  if (quizInfo && quizInfo.length) {
    const latestQuizReport = quizInfo[0];
    parsedLatestQuizReport = parseQuizReport(latestQuizReport);
    parsedLatestQuizReport.quizReportNumber = 'latest';
    if (quizInfo.length > 1) {
      const firstQuizReport = quizInfo[quizInfo.length - 1];
      parsedFirstQuizReport = parseQuizReport(firstQuizReport);
      parsedFirstQuizReport.quizReportNumber = 'first';
    }
  }

  // parsing data for user
  const userQuizReportData = {};
  /*
  we are getting get next published topic
  */
  const nextTopicId = get(userQuizQueryRes, 'data.userQuizs[0].nextComponent.topic.id');
  const { video } = topicTypes;
  // parsing data for user
  const userData = { type: 'User', typeId: `${userId}` };
  // parsing data for next topic
  const nextTopicData = { type: 'Topic', typeId: `${nextTopicId}` };
  const nextComponentData = {
    topic: nextTopicData,
    nextComponentType: video,
  };
  // parsing data for topic
  const topicData = { type: 'Topic', typeId: `${topicId}` };

  Object.assign(userQuizReportData, {
    user: userData,
    topic: topicData,
    firstQuizReport: parsedFirstQuizReport,
    latestQuizReport: parsedLatestQuizReport,
    nextComponent: nextComponentData,
  });
  return userQuizReportData;
};

export default getQuizReportMutationResolver;

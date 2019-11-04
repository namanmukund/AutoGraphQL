import { get } from 'lodash';
import {
  GLOBAL_COURSE_TITLE,
  learningObjectiveQuizReportThreshHolds,
  learningObjectiveRecommendationTexts,
  PUBLISHED,
  masteryLevels, topicTypes, questionTypes, userActionType,
} from '../../../../../../constants';
import {
  ComponentLockedError,
  DatabaseRecordNotFoundError, UnauthenticatedUserError,
} from '../../../../../../constants/errors';
import callGraphqlApi from '../../../../../api/callGraphqlApi';
import getUserIdandAppNameAfterValidation
  from '../../../preHookFunctions/validation/utils/getUserIdandAppNameAfterValidation';
import validateCurrentTopicComponent from '../../utils/validateCurrentTopicComponent';
import { log } from '../../../../../../utils';
import getMasteryLevel from '../../utils/getMasteryLevel';

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
          {title: ${GLOBAL_COURSE_TITLE}}
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

// getting questions from question bank to evaluate quiz report
const questionBankQuery = questionIdsQuery => `
  query{
    questionBanks(filter:{
      id_in: ${questionIdsQuery}
    }){
      id
      order
      questionType
      mcqOptions{
        statement
        isCorrect
      }
      fibInputOptions{
        answers
        correctPosition
      }
      fibBlocksOptions{
        statement
        correctPositions
        displayOrder
      }
      arrangeOptions{
        statement
        correctPosition
      }
      learningObjective{
        id
      }
    }
  }
  `;

// query to get user quiz to get next component
const userQuizQuery = (userId, topicId) => `
  query{
    userQuizs(
      filter: {
        and: [
          { user_some: { id: "${userId}" } }
          { topic_some: { id: "${topicId}" } }
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
) => `
  mutation addQuizDump($input: [QuizQuestionsTypeInput]!){
    addUserActivityQuizDump(
    userConnectId: "${userId}",
    topicConnectId: "${topicId}",
    input: {
      quizAction: ${userActionType.next},
       quizQuestions: $input
    }) {
      id
      quizReportId
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
  const { learningObjectiveDefaultText,
    learningObjectiveFamiliarText,
    learningObjectiveMasterText,
    learningObjectiveProficientText,
  } =
    learningObjectiveRecommendationTexts;
  const { familiar, master, proficient, defaultMastery } = masteryLevels;
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
        { recommendationText: loRecommendationText,
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

// method to create query which will contain user answer and question's options data
const checkIfUserAnswerIsCorrect = (
  questionType,
  quizQuestion,
  questionBank,
  questionBankId,
  isAttempted,
) => {
  const { mcq, fibInput, fibBlock, arrange } = questionTypes;
  const {
    userMcqAnswer: userMcqAnswers,
    userFibBlockAnswer: userFibBlockAnswers,
    userFibInputAnswer: userFibInputAnswers,
    userArrangeAnswer: userArrangeAnswers,
  } = quizQuestion;
  const {
    mcqOptions,
    fibBlocksOptions,
    fibInputOptions,
    arrangeOptions,
  } = questionBank;
  let isCorrect = false;
  let userStatement;
  let isOptionSelected;
  let statement;
  let isOptionCorrect;
  let userStatementPosition;
  let optionCorrectPositions;
  let optionPosition;
  let userAnswer;
  let answers;
  /*
  checking question type and checking for correctness
  Basically we are fetching userAnswer(userMcqAnswer, userFibBlockAnswer) and
  option(mcqOptions, fibBlocksOptions) according to type of the question
  */
  switch (questionType) {
    case mcq:
      if (mcqOptions) {
        /*
        Setting isCorrect to true at beginning so that if any of the option
        that is supposed to be true is selected false by user, we will set it
        to true
        For the case if user has not attempted question, setting it to false
        similar logic follows for all question types ahead
        */
        isCorrect = true;
        const mcqOptionsLength = mcqOptions.length;
        const userMcqAnswersLength = userMcqAnswers.length;
        mcqOptions.forEach((mcqOption) => {
          statement = get(mcqOption, 'statement').trim();
          isOptionCorrect = get(mcqOption, 'isCorrect');
          /*
          Iterating over each option in question in Question Bank and user answer and
          when statement matches, we are checking if option and user answer match
          if they do not match setting isCorrect to false
          similar logic follows for all question types ahead
          */
          if (isAttempted && userMcqAnswers.length) {
            userMcqAnswers.forEach((userMcqAnswer) => {
              userStatement = get(userMcqAnswer, 'statement').trim();
              isOptionSelected = get(userMcqAnswer, 'isSelected');
              if (userStatement === statement && isOptionSelected !== isOptionCorrect) {
                // setting isCorrect to false if correct option is not selected
                isCorrect = false;
              }
            });
          } else {
            isCorrect = false;
          }
          if (mcqOptionsLength !== userMcqAnswersLength) {
            isCorrect = false;
          }
        });
      } else {
        log(`mcqOptions are not present for question: ${questionBankId}`);
      }
      break;
    case fibBlock:
      if (fibBlocksOptions) {
        isCorrect = true;
        const totalNumberOfBlanksArray = [];
        const userFibBlockAnswersLength = userFibBlockAnswers.length;
        fibBlocksOptions.forEach((fibBlocksOption) => {
          statement = get(fibBlocksOption, 'statement').trim();
          optionCorrectPositions = get(fibBlocksOption, 'correctPositions');
          if (optionCorrectPositions.length > 0) {
            totalNumberOfBlanksArray.push(...optionCorrectPositions);
          }
          if (isAttempted && userFibBlockAnswers.length) {
            userFibBlockAnswers.forEach((userFibBlockAnswer) => {
              userStatement = get(userFibBlockAnswer, 'statement').trim();
              userStatementPosition = get(userFibBlockAnswer, 'position');
              if (userStatement === statement &&
                optionCorrectPositions.indexOf(userStatementPosition) === -1) {
                // if statement is not present in any of the possible correct positions
                // setting isCorrect to false
                isCorrect = false;
              }
            });
          } else {
            isCorrect = false;
          }
        });
        // Handling case that answer for every blank is not sent by user
        const totalUniqueNumberOfBlanksArray =
          totalNumberOfBlanksArray.filter((elem, index, array) => array.indexOf(elem) === index);
        if (totalUniqueNumberOfBlanksArray.length !== userFibBlockAnswersLength) {
          isCorrect = false;
        }
      } else {
        log(`fibBlocksOptions are not present for question: ${questionBankId}`);
      }
      break;
    case fibInput:
      if (fibInputOptions) {
        isCorrect = true;
        const fibInputOptionsLength = fibInputOptions.length;
        const userFibInputAnswersLength = userFibInputAnswers.length;
        fibInputOptions.forEach((fibInputOption) => {
          let isUserSelectedOptionCorrect = false;
          answers = get(fibInputOption, 'answers');
          optionPosition = get(fibInputOption, 'correctPosition');
          if (isAttempted && userFibInputAnswers.length) {
            userFibInputAnswers.forEach((userFibInputAnswer) => {
              userAnswer = get(userFibInputAnswer, 'answer').trim();
              userStatementPosition = get(userFibInputAnswer, 'position');
              if (userStatementPosition === optionPosition) {
                // if user answer doesn't match with any of possible answers for a position
                // setting isCorrect to false
                answers.forEach((answer) => {
                  if (answer.trim() === userAnswer) {
                    isUserSelectedOptionCorrect = true;
                  }
                });
                if (!isUserSelectedOptionCorrect) isCorrect = false;
              }
            });
          } else {
            isCorrect = false;
          }
        });
        if (fibInputOptionsLength !== userFibInputAnswersLength) {
          isCorrect = false;
        }
      } else {
        log(`fibInputOptions are not present for question: ${questionBankId}`);
      }
      break;
    case arrange:
      if (arrangeOptions) {
        isCorrect = true;
        const arrangeOptionsLength = arrangeOptions.length;
        const userArrangeAnswersLength = userArrangeAnswers.length;
        arrangeOptions.forEach((arrangeOption) => {
          statement = get(arrangeOption, 'statement').trim();
          optionPosition = get(arrangeOption, 'correctPosition');
          if (isAttempted && userArrangeAnswers.length) {
            userArrangeAnswers.forEach((userArrangeAnswer) => {
              userStatement = get(userArrangeAnswer, 'statement').trim();
              userStatementPosition = get(userArrangeAnswer, 'position');
              if (userStatement === statement && userStatementPosition !== optionPosition) {
                // if statement user order does not match correct order
                // setting isCorrect to false
                isCorrect = false;
              }
            });
          } else {
            isCorrect = false;
          }
        });
        if (arrangeOptionsLength !== userArrangeAnswersLength) {
          isCorrect = false;
        }
      } else {
        log(`arrangeOptions are not present for question: ${questionBankId}`);
      }
      break;
    default:
  }
  return {
    isCorrect,
  };
};

// method to evaluate quiz attempted by user
const evaluateUserQuiz = async (
  quizQuestionsInUserQuiz,
  quizQuestions,
) => {
  const totalQuestions = quizQuestionsInUserQuiz.length;
  // code to evaluate report of quiz
  let questionIdsQuery = '[';
  /*
  Creating quiz question report with all questions in quiz to fetch them from
  QuestionBank collection to get answers for each of question. We will use output
  of this query to evaluate quiz against user's answer in input
  */
  quizQuestionsInUserQuiz.forEach((quizQuestion) => {
    const questionId = get(quizQuestion, 'question.id');
    if (questionId) {
      questionIdsQuery += `"${questionId}", `;
    }
  });
  questionIdsQuery += ']';
  const questionBankQueryRes = await callGraphqlApi(questionBankQuery(questionIdsQuery));
  const questionBankInfo = get(questionBankQueryRes, 'data.questionBanks');
  const learningObjectiveReportObject = {};
  // Initializing quiz report with default count as 0 for all of fields
  const quizReport = {
    totalQuestionCount: totalQuestions,
    correctQuestionCount: 0,
    inCorrectQuestionCount: 0,
    unansweredQuestionCount: 0,
  };
  const loArray = [];
  /*
  Iterating over each quiz question from input and will update question in
  userQuizReport on basis of input(isCorrect, isAttempted etc.)
  */
  questionBankInfo.forEach((questionBank) => {
    let isAttempted = false;
    let isCorrect = false;
    /*
    We get quiz questions from Question Bank and iterate on each one of them and
    use them to know the correct answer of questions, question type etc.
    */
    quizQuestions.forEach((quizQuestion) => {
      const currentQuestionId = get(quizQuestion, 'questionConnectId');
      const { id: questionBankId } = questionBank;
      /*
      iterating over questions from input and question bank and
      comparing for same question and evaluating if it is correct
      */
      if (currentQuestionId === questionBankId) {
        const { questionType } = questionBank;
        const { isAttempted: isQuestionAttempted } = quizQuestion;
        if (isQuestionAttempted) {
          isAttempted = true;
        }
        if (isAttempted) {
          const {
            isCorrect: isUserAnswerCorrect,
          } = checkIfUserAnswerIsCorrect(
            questionType,
            quizQuestion,
            questionBank,
            questionBankId,
            isAttempted,
          );
          isCorrect = isUserAnswerCorrect;
        }
      }
    });
    const loId = get(questionBank, 'learningObjective.id');
    // initializing learning objective report it is not already populated
    // Here loId is the learning objective id of the question
    if (!learningObjectiveReportObject[loId]) {
      /*
      we are pushing all the learning objective ids in an array and we will
      use this array to iterate over each LO and get report of each LO from
      learningObjectiveReportObject and will construct query accordingly.
      */
      loArray.push(loId);
      learningObjectiveReportObject[loId] = {
        totalQuestionCount: 0,
        correctQuestionCount: 0,
        inCorrectQuestionCount: 0,
        unansweredQuestionCount: 0,
        learningObjective: { id: loId },
      };
    }
    /*
      calculating quiz report lo wise and topic wise on basis of
      isAttempted and isCorrect
      */
    learningObjectiveReportObject[loId].totalQuestionCount += 1;
    if (isAttempted) {
      if (isCorrect) {
        learningObjectiveReportObject[loId].correctQuestionCount += 1;
        quizReport.correctQuestionCount += 1;
      } else {
        learningObjectiveReportObject[loId].inCorrectQuestionCount += 1;
        quizReport.inCorrectQuestionCount += 1;
      }
    } else {
      learningObjectiveReportObject[loId].unansweredQuestionCount += 1;
      quizReport.unansweredQuestionCount += 1;
    }
  });
  const learningObjectiveReport = [];
  loArray.forEach((loIdInArray) => {
    learningObjectiveReport.push(learningObjectiveReportObject[loIdInArray]);
  });
  const masteryLevel =
    getMasteryLevel(quizReport.correctQuestionCount, quizReport.totalQuestionCount);
  Object.assign(quizReport, {
    masteryLevel,
  });

  return {
    learningObjectiveReport,
    quizReport,
  };
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
  const { topicId, quizQuestions } = input;
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
  const userQuizQueryRes = await callGraphqlApi(userQuizQuery(userId, topicId));
  const userQuizInfo = get(userQuizQueryRes, 'data.userQuizs[0]');
  const quizQuestionsInUserQuiz = get(userQuizInfo, 'quiz');
  if (!quizQuestionsInUserQuiz ||
    !quizQuestionsInUserQuiz.length) {
    log('Quiz Questions are not present in UserQuiz in getQuizReport');
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'Topic.QuizQuestions: is not present',
      },
    });
  }

  // Constructing data for first quiz report
  let parsedFirstQuizReport;
  const quizRes = await callGraphqlApi(
    getQuizReportQuery(userId, topicId),
    '',
    '',
    '',
    token,
  );
  const quizInfo = get(quizRes, 'data.userQuizReports');
  if (quizInfo && quizInfo.length > 1) {
    const firstQuizReport = quizInfo[quizInfo.length - 1];
    parsedFirstQuizReport = parseQuizReport(firstQuizReport);
    parsedFirstQuizReport.quizReportNumber = 'first';
  }

  // Sending async user quiz dump
  callGraphqlApi(
    addUserQuizDump(userId, topicId),
    {
      input: quizQuestions,
    },
    '',
    '',
    token,
  );

  // Constructing data for latest quiz report
  const {
    learningObjectiveReport,
    quizReport,
  } = await evaluateUserQuiz(
    quizQuestionsInUserQuiz,
    quizQuestions,
  );

  const latestQuizReport = {
    learningObjectiveReport,
    quizReport,
  };
  const parsedLatestQuizReport = parseQuizReport(latestQuizReport);
  parsedLatestQuizReport.quizReportNumber = 'latest';

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
    nextComponentType: video };
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

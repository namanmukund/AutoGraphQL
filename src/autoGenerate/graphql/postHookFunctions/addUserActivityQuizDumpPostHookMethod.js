import { get } from 'lodash';
import {
  OLD_COURSE_ID, topicTypes,
  PUBLISHED, questionTypes, scholarshipThreshHolds,
  userActionType,
  userTopicTypeStatus,
} from '../../../../constants';
import { log } from '../../../../utils';
import {
  DatabaseRecordNotFoundError,
  QuizQuestionsNotPresentError,
} from '../../../../constants/errors';
import updateCurrentComponentStatus from './utils/updateCurrentComponentStatus';
import updateCurrentComponentStatusOfNewCourse from './utils/updateCurrentComponentStatusOfNewCourse';
import getMasteryLevel from '../resolvers/utils/getMasteryLevel';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import validateTokenAndExtractInformation
  from '../preHookFunctions/validation/utils/validateTokenAndExtractInformation';
import { MENTEE } from '../../../../constants/roles';
import getNextComponent from './utils/getNextComponent';

// query to fetch user quiz info
const userQuizQuery = (
  userId,
  topicId,
  courseId
) => `
   query{
      userQuizs(filter:{
        and:[
          {user_some:{
          id:"${userId}"
          }},
          {topic_some:{
            id:"${topicId}"
          }},
          ${courseId ? `{course_some:{id:"${courseId}"}},` : ''}
          {
            quizStatus: ${userTopicTypeStatus.incomplete}
          }
        ]
      }){
        id
        quiz{
          question{
            id
          }
          questionDisplayOrder
        }
        quizStatus
        topic{
        id
        order
        topicComponentRule{
          componentName
          order
          childComponentName
          learningObjective{
            id
            order
            messagesMeta{
              count
            }
            questionBankMeta(filter:{and:[{assessmentType:practiceQuestion}{status:${PUBLISHED}}]}){
              count
            }
            comicStripsMeta(filter:{status:${PUBLISHED}}){
              count
            }
          }
          blockBasedProject{
            id
            order
          }
          video{
            id
          }
        }
      }
      nextComponent{
        topic{
          id
          learningObjectives(filter:{
            status: ${PUBLISHED}
            }
            orderBy: order_ASC
          ){
            id
          }
        }
        nextComponentType
      }
      }
    }
    `;

// getting questions from question bank to evaluate quiz report
const questionBankQuery = (questionIdsQuery) => `
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

// mutation to update UserQuiz, pushing updated quiz questions
const updateUserQuizMutation = (userQuizId) => `
  mutation{
    updateUserQuiz(id:"${userQuizId}",  input:{
      quizStatus: ${userTopicTypeStatus.complete}
    }){
      id
    }
  }
  `;

// mutation to add UserQuizReport
const addUserQuizReport = (
  userId,
  topicId,
  quizReportQuery,
  learningObjectiveReportQuery,
  pushManyQuery,
  nextComponentQuery,
) => `
  mutation{
    addUserQuizReport(
    userConnectId: "${userId}"
    topicConnectId: "${topicId}"
    input:{
      ${quizReportQuery}
      ${learningObjectiveReportQuery}
      ${pushManyQuery}
      ${nextComponentQuery}
    }){
      id
    }
  }
  `;

// query to get current user profile to get current scholarship status
const userProfileQuery = (userId) => `
  query{
    userProfiles(filter:{
      user_some:{
        id: "${userId}"
      }
    }){
      id
      topicsCompleted
      proficientTopicCount
      freeProficientTopicCount
      masteredTopicCount
      freeMasteredTopicCount
      familiarTopicCount
      freeFamiliarTopicCount
    }
  }
`;

// query to update user profile if it exists already
const updateUserProfile = (
  userProfileId,
  userProfileTopicConnectQuery,
  topicsCompleted,
  proficientTopicCount,
  freeProficientTopicCount,
  masteredTopicCount,
  freeMasteredTopicCount,
  familiarTopicCount,
  freeFamiliarTopicCount,
) => `
  mutation{
    updateUserProfile(id:"${userProfileId}"
    ${userProfileTopicConnectQuery}
      input:{
        topicsCompleted: ${topicsCompleted}
        proficientTopicCount: ${proficientTopicCount}
        freeProficientTopicCount: ${freeProficientTopicCount}
        masteredTopicCount: ${masteredTopicCount}
        freeMasteredTopicCount: ${freeMasteredTopicCount}
        familiarTopicCount: ${familiarTopicCount}
        freeFamiliarTopicCount: ${freeFamiliarTopicCount}
      }
    ){
     id 
    }
  }
  `;

// getting mentee session id on basis of topic id and user id
const menteeSessionQuery = (userId, topicId) => `
query{
  menteeSessions(filter:{
    and:[
      {topic_some:{id: "${topicId}"}}
      {user_some:{id: "${userId}"}}
    ]
  }){
    id
  }
}
  `;

// getting mentorMenteeSession id on basis of topic id and menteeSession id
const mentorMenteeSessionQuery = (menteeSessionId, topicId) => `
query{
  mentorMenteeSessions(filter:{
    and:[
      {topic_some:{id: "${topicId}"}}
      {menteeSession_some:{id: "${menteeSessionId}"}}
    ]
  }){
    id
  }
}
  `;

// mutation to update UserQuiz, pushing updated quiz questions
const updateMentorMenteeSessionMutation = (mentorMenteeSessionId) => `
  mutation{
    updateMentorMenteeSession(id:"${mentorMenteeSessionId}",  input:{
      isQuizSubmitted: true
    }){
      id
    }
  }
  `;

const escapeString = (value) => value.replace(/\\([\s\S])|(")/g, '\\$1$2');

// method to create query which will contain user answer and question's options data
const createQueryForUserAnswersAndOptions = (
  questionType,
  quizQuestion,
  questionBank,
  questionBankId,
  isAttempted,
) => {
  const {
    mcq, fibInput, fibBlock, arrange,
  } = questionTypes;
  let userAnswersAndQuestionOptionsQuery = '';
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
        // This query will contain info for correct and user answer
        let userMcqQuery = 'userMcqAnswer: [';
        let mcqOptionQuery = 'mcqOptions: [';
        const macqOptionsLength = mcqOptions.length;
        const userMcqAnswersLength = userMcqAnswers && userMcqAnswers.length;
        mcqOptions.forEach((mcqOption) => {
          statement = get(mcqOption, 'statement').trim();
          isOptionCorrect = get(mcqOption, 'isCorrect');
          /*
          Iterating over each option in question in Question Bank and user answer and
          when statement matches, we are checking if option and user answer match
          if they do not match setting isCorrect to false
          similar logic follows for all question types ahead
          */
          if (isAttempted && userMcqAnswersLength) {
            userMcqAnswers.forEach((userMcqAnswer) => {
              userStatement = get(userMcqAnswer, 'statement').trim();
              isOptionSelected = get(userMcqAnswer, 'isSelected');
              if (userStatement === statement) {
                const escapedUserStatement = escapeString(userStatement);
                userMcqQuery += `{statement: "${escapedUserStatement}", `;
                userMcqQuery += `isSelected: ${isOptionSelected}}, `;
                // setting isCorrect to false if correct option is not selected
                if (isOptionSelected !== isOptionCorrect) {
                  isCorrect = false;
                }
              }
            });
          } else {
            isCorrect = false;
          }
          if (macqOptionsLength !== userMcqAnswersLength) {
            isCorrect = false;
          }
          // constructing query for correct mcqOptions
          // replicating info from question Bank
          const escapedStatement = escapeString(statement);
          mcqOptionQuery += `{statement: "${escapedStatement}", `;
          mcqOptionQuery += `isCorrect: ${isOptionCorrect}}, `;
        });
        userMcqQuery += ']';
        mcqOptionQuery += ']';
        userAnswersAndQuestionOptionsQuery += `isCorrect: ${isCorrect},
                                          ${userMcqQuery}
                                          ${mcqOptionQuery}
                                         `;
      } else {
        log(`mcqOptions are not present for question: ${questionBankId}`);
      }
      break;
    case fibBlock:
      if (fibBlocksOptions) {
        isCorrect = true;
        let optionDisplayOrder;
        let userFibBlockQuery = 'userFibBlockAnswer: [';
        let fibBlockOptionQuery = 'fibBlocksOptions: [';
        const totalNumberOfBlanksArray = [];
        const userFibBlockAnswersLength = userFibBlockAnswers && userFibBlockAnswers.length;
        fibBlocksOptions.forEach((fibBlocksOption) => {
          statement = get(fibBlocksOption, 'statement').trim();
          const escapedStatement = escapeString(statement);
          optionCorrectPositions = get(fibBlocksOption, 'correctPositions');
          if (optionCorrectPositions.length > 0) {
            totalNumberOfBlanksArray.push(...optionCorrectPositions);
          }
          optionDisplayOrder = get(fibBlocksOption, 'displayOrder');
          if (isAttempted && userFibBlockAnswersLength) {
            userFibBlockAnswers.forEach((userFibBlockAnswer) => {
              userStatement = get(userFibBlockAnswer, 'statement').trim();
              userStatementPosition = get(userFibBlockAnswer, 'position');
              if (userStatement === statement) {
                userFibBlockQuery += `{statement: "${escapedStatement}", `;
                userFibBlockQuery += `position: ${userStatementPosition}}, `;
                // if statement is not present in any of the possible correct positions
                // setting isCorrect to false
                if (optionCorrectPositions.indexOf(userStatementPosition) === -1) {
                  isCorrect = false;
                }
              }
            });
          } else {
            isCorrect = false;
          }
          // constructing query for correct fibBlockOptions
          // replicating info from question Bank
          let correctPositionsQuery = '[';
          optionCorrectPositions.forEach((optionCorrectPosition) => {
            correctPositionsQuery += `${optionCorrectPosition}, `;
          });
          correctPositionsQuery += ']';
          fibBlockOptionQuery += `{statement: "${escapedStatement}", `;
          fibBlockOptionQuery += `displayOrder: ${optionDisplayOrder}, `;
          fibBlockOptionQuery += `correctPositions: ${correctPositionsQuery}}, `;
        });
        // Handling case that answer for every blank is sent by user
        const totalUniqueNumberOfBlanksArray = totalNumberOfBlanksArray.filter((elem, index, array) => array.indexOf(elem) === index);
        if (totalUniqueNumberOfBlanksArray.length !== userFibBlockAnswersLength) {
          isCorrect = false;
        }
        userFibBlockQuery += ']';
        fibBlockOptionQuery += ']';
        userAnswersAndQuestionOptionsQuery += `isCorrect: ${isCorrect},
                                          ${userFibBlockQuery}
                                          ${fibBlockOptionQuery}
                                         `;
      } else {
        log(`fibBlocksOptions are not present for question: ${questionBankId}`);
      }
      break;
    case fibInput:
      if (fibInputOptions) {
        isCorrect = true;
        let userFibInputQuery = 'userFibInputAnswer: [';
        let fibInputOptionQuery = 'fibInputOptions: [';
        const fibInputOptionsLength = fibInputOptions.length;
        const userFibInputAnswersLength = userFibInputAnswers && userFibInputAnswers.length;
        fibInputOptions.forEach((fibInputOption) => {
          let isUserSelectedOptionCorrect = false;
          answers = get(fibInputOption, 'answers');
          optionPosition = get(fibInputOption, 'correctPosition');
          if (isAttempted && userFibInputAnswers) {
            userFibInputAnswers.forEach((userFibInputAnswer) => {
              userAnswer = get(userFibInputAnswer, 'answer').trim();
              userStatementPosition = get(userFibInputAnswer, 'position');
              if (userStatementPosition === optionPosition) {
                const escapedUserAns = escapeString(userAnswer);
                userFibInputQuery += `{answer: "${escapedUserAns}", `;
                userFibInputQuery += `position: ${userStatementPosition}}, `;
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
          // constructing query for correct fibInputOptions
          // replicating info from question Bank
          let answersQuery = '[';
          answers.forEach((answer) => {
            const escapedAns = escapeString(answer.trim());
            answersQuery += `"${escapedAns}", `;
          });
          answersQuery += ']';
          fibInputOptionQuery += `{correctPosition: ${optionPosition}, `;
          fibInputOptionQuery += `answers: ${answersQuery}}, `;
        });
        if (fibInputOptionsLength !== userFibInputAnswersLength) {
          isCorrect = false;
        }
        userFibInputQuery += ']';
        fibInputOptionQuery += ']';
        userAnswersAndQuestionOptionsQuery += `isCorrect: ${isCorrect},
                                          ${userFibInputQuery}
                                          ${fibInputOptionQuery}
                                         `;
      } else {
        log(`fibInputOptions are not present for question: ${questionBankId}`);
      }
      break;
    case arrange:
      if (arrangeOptions) {
        isCorrect = true;
        let userArrangeQuery = 'userArrangeAnswer: [';
        let arrangeOptionsQuery = 'arrangeOptions: [';
        const arrangeOptionsLength = arrangeOptions.length;
        const userArrangeAnswersLength = userArrangeAnswers && userArrangeAnswers.length;
        arrangeOptions.forEach((arrangeOption) => {
          statement = get(arrangeOption, 'statement').trim();
          optionPosition = get(arrangeOption, 'correctPosition');
          if (isAttempted && userArrangeAnswersLength) {
            userArrangeAnswers.forEach((userArrangeAnswer) => {
              userStatement = get(userArrangeAnswer, 'statement').trim();
              userStatementPosition = get(userArrangeAnswer, 'position');
              if (userStatement === statement) {
                const escapedUserStatement = escapeString(userStatement);
                userArrangeQuery += `{statement: "${escapedUserStatement}", `;
                userArrangeQuery += `position: ${userStatementPosition}}, `;
                // if statement user order does not match correct order
                // setting isCorrect to false
                if (userStatementPosition !== optionPosition) {
                  isCorrect = false;
                }
              }
            });
          } else {
            isCorrect = false;
          }
          // constructing query for correct arrangeOptions
          // replicating info from question Bank
          const escapedStatement = escapeString(statement);
          arrangeOptionsQuery += `{statement: "${escapedStatement}", `;
          arrangeOptionsQuery += `correctPosition: ${optionPosition}}, `;
        });
        if (arrangeOptionsLength !== userArrangeAnswersLength) {
          isCorrect = false;
        }
        userArrangeQuery += ']';
        arrangeOptionsQuery += ']';
        userAnswersAndQuestionOptionsQuery += `isCorrect: ${isCorrect},
                                          ${userArrangeQuery}
                                          ${arrangeOptionsQuery}
                                         `;
      } else {
        log(`arrangeOptions are not present for question: ${questionBankId}`);
      }
      break;
    default:
  }
  return {
    userAnswersAndQuestionOptionsQuery,
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
  const questionDisplayOrderArray = [];
  /*
  Creating quiz question query with all questions in quiz to fetch them from
  QuestionBank collection to get answers for each of question. We will use output
  of this query to evaluate quiz against user's answer in input
  */
  quizQuestionsInUserQuiz.forEach((quizQuestion) => {
    const questionId = get(quizQuestion, 'question.id');
    const questionDisplayOrder = get(quizQuestion, 'questionDisplayOrder');
    if (!questionDisplayOrderArray[questionId]) {
      questionDisplayOrderArray[questionId] = {
        questionDisplayOrder,
      };
    }
    if (questionId) {
      questionIdsQuery += `"${questionId}", `;
    }
  });
  questionIdsQuery += ']';
  const questionBankQueryRes = await callLocalGraphqlApi(questionBankQuery(questionIdsQuery));
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
  pushMany query to store user's answer and correct answer in User quiz report
  quiz field will be used by client when user hits view answers on report page
  And it will get generated for each report(when user hits next)
  */
  let pushManyQuery = 'quizAnswers:[';
  /*
  Iterating over each quiz question from input and will update question in
  userQuizReport on basis of input(isCorrect, isAttempted etc.)
  */
  questionBankInfo.forEach((questionBank) => {
    const { id: questionBankId } = questionBank;
    let userAnsweredQuizQuestion = {};
    let isAttempted = false;
    let isCorrect = false;
    /*
    We get quiz questions from Question Bank and iterate on each one of them and
    use them to know the correct answer of questions, question type etc.
    */
    quizQuestions.forEach((quizQuestion) => {
      const currentQuestionId = get(quizQuestion, 'question.typeId');
      /*
      iterating over questions from input and question bank and
      comparing for same question and evaluating if it is correct
      */
      if (currentQuestionId === questionBankId) {
        userAnsweredQuizQuestion = quizQuestion;
        // this field will be used for validation if all questions present in userQuiz is
        // sent by client
        const { isAttempted: isQuestionAttempted } = quizQuestion;
        if (isQuestionAttempted) {
          isAttempted = true;
        }
      }
    });
    pushManyQuery += `{ questionConnectId: "${questionBankId}", `;
    const { questionType } = questionBank;
    const userQuestionDisplayOrder = questionDisplayOrderArray[questionBankId]
      && questionDisplayOrderArray[questionBankId].questionDisplayOrder;
    if (userQuestionDisplayOrder) {
      pushManyQuery += `questionDisplayOrder: ${userQuestionDisplayOrder}, `;
    }
    if (isAttempted) {
      pushManyQuery += `isAttempted: ${isAttempted}, `;
    } else {
      pushManyQuery += 'isAttempted: false, ';
    }
    // calling method to append user quiz answers and question options to pushMany query
    const {
      userAnswersAndQuestionOptionsQuery,
      isCorrect: isUserAnswerCorrect,
    } = createQueryForUserAnswersAndOptions(
      questionType,
      userAnsweredQuizQuestion,
      questionBank,
      questionBankId,
      isAttempted,
    );
    if (isUserAnswerCorrect) {
      isCorrect = true;
    }
    pushManyQuery += userAnswersAndQuestionOptionsQuery;
    pushManyQuery += '}, ';
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
        learningObjective: loId,
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
  // both for loop end here
  const {
    totalQuestionCount: totalQuestionCountQuizReport,
    inCorrectQuestionCount: inCorrectQuestionCountQuizReport,
    correctQuestionCount: correctQuestionCountQuizReport,
    unansweredQuestionCount: unansweredQuestionCountQuizReport,
  } = quizReport;
  const masteryLevel = getMasteryLevel(correctQuestionCountQuizReport, totalQuestionCountQuizReport);
  const quizReportQuery = `quizReport:{
                                    totalQuestionCount: ${totalQuestionCountQuizReport}
                                    inCorrectQuestionCount: ${inCorrectQuestionCountQuizReport}
                                    correctQuestionCount: ${correctQuestionCountQuizReport}
                                    unansweredQuestionCount: ${unansweredQuestionCountQuizReport}
                                    masteryLevel: ${masteryLevel}
                                  }`;
  let learningObjectiveReportQuery = 'learningObjectiveReport: [';
  // creating lo report query on basis of objects in learningObjectiveReportObject
  loArray.forEach((loIdInArray) => {
    const {
      totalQuestionCount: totalQuestionCountLOReport,
      inCorrectQuestionCount: inCorrectQuestionCountLOReport,
      correctQuestionCount: correctQuestionCountLOReport,
      unansweredQuestionCount: unansweredQuestionCountLOReport,
    } = learningObjectiveReportObject[loIdInArray];
    learningObjectiveReportQuery += `{
                                    totalQuestionCount: ${totalQuestionCountLOReport}
                                    inCorrectQuestionCount: ${inCorrectQuestionCountLOReport}
                                    correctQuestionCount: ${correctQuestionCountLOReport}
                                    unansweredQuestionCount: ${unansweredQuestionCountLOReport}
                                    learningObjectiveConnectId: "${loIdInArray}"
                                  }, `;
  });
  learningObjectiveReportQuery += ']';
  pushManyQuery += ']';
  return {
    pushManyQuery,
    quizReportQuery,
    learningObjectiveReportQuery,
    quizReport,
  };
};

/*
logic for evaluating scholarship of user
and it will be done only on first attempt of quiz so we are checking if the called topic
is current topic or not and current topic component should be quiz
*/
const evaluateUserScholarship = async (
  currentTopicComponentInfo,
  userId,
  topicId,
  quizReport,
) => {
  const { quiz } = topicTypes;
  const {
    currentTopicComponentType: currentTopicComponent,
    currentTopic,
  } = currentTopicComponentInfo;
  const { id: currentTopicId } = currentTopic;
  if (currentTopicComponent === quiz
    && currentTopicId === topicId) {
    // code for calculating total quiz report accuracy for scholarship
    const { totalQuestionCount, correctQuestionCount } = quizReport;
    let accuracy = 0;
    if (totalQuestionCount > 0) {
      accuracy = (correctQuestionCount / totalQuestionCount) * 100;
    } else {
      log('There are no questions in quiz. Something is wrong');
    }
    // getting userProfile Data to get current scholarship status of user
    // there is logic in post hook of userProfile to create userProfile with
    // default data if it was not present. So we will always get this
    //
    const userProfileResult = await callLocalGraphqlApi(userProfileQuery(userId));
    const userProfileInfo = get(userProfileResult, 'data.userProfiles[0]');
    const userProfileId = get(userProfileInfo, 'id');
    if (!userProfileId) {
      log('Not able to fetch userProfileInfo in addUserActivityQuizDumpPostHookMethod');
    }
    const {
      topicsCompleted: topicsCompletedInUserProfile,
      proficientTopicCount: proficientTopicCountInUserProfile,
      freeProficientTopicCount: freeProficientTopicCountInUserProfile,
      masteredTopicCount: masteredTopicCountInUserProfile,
      freeMasteredTopicCount: freeMasteredTopicCountInUserProfile,
      familiarTopicCount: familiarTopicCountInUserProfile,
      freeFamiliarTopicCount: freeFamiliarTopicCountInUserProfile,
    } = userProfileInfo;
    // setting each field in let as they will be updated further
    let topicsCompleted = topicsCompletedInUserProfile;
    let proficientTopicCount = proficientTopicCountInUserProfile;
    let freeProficientTopicCount = freeProficientTopicCountInUserProfile;
    let masteredTopicCount = masteredTopicCountInUserProfile;
    let freeMasteredTopicCount = freeMasteredTopicCountInUserProfile;
    let familiarTopicCount = familiarTopicCountInUserProfile;
    let freeFamiliarTopicCount = freeFamiliarTopicCountInUserProfile;

    // adding topic in total topics completed by user
    let userProfileTopicConnectQuery = `totalTopicsConnectIds:["${topicId}"] `;
    const { proficient, master, familiar } = scholarshipThreshHolds;
    topicsCompleted += 1;
    // proficient topic logic, proficient is 100 defined in config
    if (accuracy === proficient) {
      proficientTopicCount += 1;
      userProfileTopicConnectQuery += `proficientTopicsConnectIds:["${topicId}"] `;
    } else if (freeProficientTopicCount > 0) {
      freeProficientTopicCount -= 1;
    }
    // mastered topic logic, master is 80 defined in config
    if (accuracy >= master) {
      masteredTopicCount += 1;
      userProfileTopicConnectQuery += `masteredTopicsConnectIds:["${topicId}"] `;
    } else if (freeMasteredTopicCount > 0) {
      freeMasteredTopicCount -= 1;
    }
    // familiar topic logic, familiar is 60 defined in config
    if (accuracy >= familiar) {
      familiarTopicCount += 1;
      userProfileTopicConnectQuery += `familiarTopicsConnectIds:["${topicId}"] `;
    } else if (freeFamiliarTopicCount > 0) {
      freeFamiliarTopicCount -= 1;
    }

    // updating user profile
    await callLocalGraphqlApi(updateUserProfile(
      userProfileId,
      userProfileTopicConnectQuery,
      topicsCompleted,
      proficientTopicCount,
      freeProficientTopicCount,
      masteredTopicCount,
      freeMasteredTopicCount,
      familiarTopicCount,
      freeFamiliarTopicCount,
    ));
  }
  return true;
};

/*
UserActivityQuizDump, current component topic status and
UserQuiz is updated according to -
  -current topic component status
  -userQuiz for provided userId and topic id
  -topic.
Report for quiz(topic and Lo wise) is generated according to the questions array
 (Collection: UserQuizReport).
UserProfile is also updated if user is attempting quiz for the first time,
 which contains scholarship information.
*/
const addUserActivityQuizDumpPostHookMethod = async (input, mutationName, context) => {
  const userId = get(input, 'user.typeId');
  const topicId = get(input, 'topic.typeId');
  const courseId = get(input, 'course.typeId');
  if (!userId || !topicId) {
    log('Either one of userId or topicId is missing in input of addUserActivityQuizDumpPostHookMethod');
  }
  const { next } = userActionType;
  /*
  we are getting userQuiz for below purpose:
  -we get userQuiz id , which will be used further to update the document
  -we get next component from the document and update user current topic component status with same
  */
  const userQuizQueryRes = await callLocalGraphqlApi(userQuizQuery(userId, topicId, courseId));
  const userQuizInfo = get(userQuizQueryRes, 'data.userQuizs[0]');
  const quizQuestionsInUserQuiz = get(userQuizInfo, 'quiz');
  const nextTopicId = get(userQuizInfo, 'nextComponent.topic.id');
  const { id: userQuizId } = userQuizInfo;
  const learningObjectiveConnectId = get(userQuizInfo, 'nextComponent.topic.learningObjectives[0].id');
  /*
  Getting data for user current topic component status from context based on mutationName
  This will be used to cover the case that current component status will only get changed, if
  called component is equal to current component and user has just consumed(next action) it
  And current component status will not get changed when it is already consumed in past
  */
  const currentTopicComponentInfo = get(context, `${mutationName}.userCurrentTopicComponentStatuses`);
  const { quizAction, quizQuestions } = input;
  /*
  Calling method to update current user Topic Component status
  */
  if (!courseId || (courseId === OLD_COURSE_ID)) {
    await updateCurrentComponentStatus(
      currentTopicComponentInfo,
      quizAction,
      topicId,
      '',
      'quiz',
      '',
      '',
      '',
      learningObjectiveConnectId,
      nextTopicId,
    );
  } else {
    const topicComponentRule = get(userQuizInfo, 'topic.topicComponentRule', []);
    const topicOrder = get(userQuizInfo, 'topic.order');

    await updateCurrentComponentStatusOfNewCourse(
      courseId,
      currentTopicComponentInfo,
      quizAction,
      topicId,
      '',
      '',
      '',
      'quiz',
      topicComponentRule,
      topicOrder,
    );
  }

  // getting user role from context. We will allow updating mentorMenteeSession isQuizSubmitted if logged in user is mentee
  const userInfo = validateTokenAndExtractInformation(context, false);
  const {
    currentUser,
  } = userInfo;
  const userRoleFromContext = currentUser && currentUser.role;

  // throwing error if client has not send any question in input
  if (!quizQuestions || !quizQuestions.length) {
    log('QuizQuestions are not present in input in addUserActivityQuizDumpPostHookMethod');
    throw new QuizQuestionsNotPresentError();
  }
  // throwing error if there are no published questions in database
  if (!quizQuestionsInUserQuiz
    || !quizQuestionsInUserQuiz.length) {
    log('Quiz Questions are not present in UserQuiz in addUserActivityQuizDumpPostHookMethod');
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'Topic.QuizQuestions: is not present',
      },
    });
  }

  // getting menteeSessionId to update mentorMenteeSession in case of a mentee
  if (userRoleFromContext === MENTEE) {
    const menteeSessionRes = await callLocalGraphqlApi(menteeSessionQuery(userId, topicId));
    const menteeSessionInfo = get(menteeSessionRes, 'data.menteeSessions[0]');
    const menteeSessionId = get(menteeSessionInfo, 'id');
    if (!menteeSessionId) {
      log('Not able to get menteeSessionId in addUserActivityQuizDumpPostHookMethod');
    }
    // Ideally menteeSessionId should be there if user has reached to this point
    if (menteeSessionId) {
      const mentorMenteeSessionRes = await callLocalGraphqlApi(mentorMenteeSessionQuery(menteeSessionId, topicId));
      const mentorMenteeSessionInfo = get(mentorMenteeSessionRes, 'data.mentorMenteeSessions[0]');
      const mentorMenteeSessionId = get(mentorMenteeSessionInfo, 'id');
      if (!mentorMenteeSessionId) {
        log('Not able to get mentorMenteeSessionId in addUserActivityQuizDumpPostHookMethod');
      }
      if (mentorMenteeSessionId) {
        // updating isQuizSubmitted for the topic for which quiz dump is called
        await callLocalGraphqlApi(updateMentorMenteeSessionMutation(mentorMenteeSessionId));
      }
    }
  }

  /*
  Quiz report will only get created when user hits next after completing quiz
  In case user closes app in between quiz, he will have to give whole quiz again
  And there will be no record present for abandoned quiz in DB as well
  */
  if (quizAction === next) {
    // calling method to evaluate quiz and generate report
    const {
      pushManyQuery,
      quizReportQuery,
      learningObjectiveReportQuery,
      quizReport,
    } = await evaluateUserQuiz(
      quizQuestionsInUserQuiz,
      quizQuestions,
    );
    if (!userQuizId) {
      log('Not able to fetch userQuizId in addUserActivityQuizDumpPostHookMethod');
    }
    // updating UserQuiz to change status to complete
    await callLocalGraphqlApi(updateUserQuizMutation(userQuizId));
    const nextComponentQuery = getNextComponent(
      '',
      nextTopicId,
      'quiz',
    );
    // generating quiz report of user
    const addUserQuizReportRes = await callLocalGraphqlApi(addUserQuizReport(
      userId,
      topicId,
      quizReportQuery,
      learningObjectiveReportQuery,
      pushManyQuery,
      nextComponentQuery,
    ));
    const addUserQuizReportId = get(addUserQuizReportRes, 'data.addUserQuizReport.id');
    Object.assign(input, {
      quizReportId: addUserQuizReportId,
    });
    // calling method to evaluate scholarship of user if he is attempting quiz for the first time
    await evaluateUserScholarship(
      currentTopicComponentInfo,
      userId,
      topicId,
      quizReport,
    );
  }
  return true;
};

export default addUserActivityQuizDumpPostHookMethod;

import { get } from 'lodash';
import callGraphqlApi from '../../../api/callGraphqlApi';
import {
  topicTypes, freeTopicCount,
  PUBLISHED, questionTypes, scholarshipThreshHolds,
  userActionType,
  userTopicTypeStatus,
} from '../../../../constants';
import {
  DatabaseRecordNotFoundError, QuizQuestionsNotPresentError,
  UserOrTopicNotPresentError,
} from '../../../../constants/errors';
import { log } from '../../../../utils';
import getUserCurrentTopicComponentStatus from '../../utils/getUserCurrentTopicComponentStatus';

// query to update user current topic component status
const updateUserCurrentTopicComponentStatusMutation = async (
  currentTopicComponentId,
  nextTopicId,
  loQuery,
) => `
  mutation{
    updateUserCurrentTopicComponentStatus(id:"${currentTopicComponentId}",  input:{
      currentTopicComponentType: ${topicTypes.video}
    },
    currentTopicConnectId:"${nextTopicId}"
    ${loQuery}
    ){
      id
    }
  }
  `;

// query to fetch user quiz info
const userQuizQuery = async (
  userId,
  topicId,
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
          {
            quizStatus: ${userTopicTypeStatus.incomplete}
          }
        ]
      }){
        id
        quizStatus
        nextComponent{
        topic{
          id
          learningObjectives(filter:{
            status: ${PUBLISHED}
            }
            orderBy: order_ASC
            first: 1
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
const questionBankQuery = async questionIdsQuery => `
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

// mutation to update UserQuiz, popping all quiz questions
const updateUserQuizMutation = async (
  userQuizId,
  popAllQuery,
) => `
   mutation{
      updateUserQuiz(id:"${userQuizId}",  input:{
        quizStatus: ${userTopicTypeStatus.complete}
        ${popAllQuery}
      }){
        id
      }
    }
    `;

// mutation to update UserQuiz, pushing updated quiz questions
const updateUserQuizMutationQuiz = async (
  userQuizId,
  pushManyQuery) => `
  mutation{
    updateUserQuiz(id:"${userQuizId}",  input:{
      ${pushManyQuery}
    }){
      id
    }
  }
  `;

// mutation to add UserQuizReport
const addUserQuizReport = async (
  userId,
  topicId,
  quizReportQuery,
  learningObjectiveReportQuery,
) => `
  mutation{
    addUserQuizReport(
    userConnectId: "${userId}"
    topicConnectId: "${topicId}"
    input:{
      ${quizReportQuery}
      ${learningObjectiveReportQuery}
    }){
      id
    }
  }
  `;

// query to get current user profile to get current scholarship status
const userProfileQuery = async userId => `
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

// query to create user profile if it does not exist already
const addUserProfile = async (
  userId,
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
    addUserProfile(
      userConnectId:"${userId}"
      ${userProfileTopicConnectQuery}
      input:{
        topicsCompleted: ${topicsCompleted}
        proficientTopicCount: ${proficientTopicCount}
        freeProficientTopicCount: ${freeProficientTopicCount}
        masteredTopicCount: ${masteredTopicCount}
        freeMasteredTopicCount: ${freeMasteredTopicCount}
        familiarTopicCount: ${familiarTopicCount}
        freeFamiliarTopicCount: ${freeFamiliarTopicCount}
      }){
      id
    }
  }
  `;

// query to update user profile if it exists already
const updateUserProfile = async (
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
const addUserActivityQuizDumpPostHookMethod = async (input) => {
  const userId = get(input, 'user.typeId');
  const topicId = get(input, 'topic.typeId');
  if (!userId || !topicId) {
    log('Either one of userId or topicId is missing in input of addUserActivityQuizDumpPostHookMethod');
    throw new UserOrTopicNotPresentError();
  }
  const { next } = userActionType;
  const { quiz } = topicTypes;
  const currentTopicQuery = `currentTopic{
                                id 
                             }`;
  const userCurrentTopicComponentStatusRes =
    await getUserCurrentTopicComponentStatus(
      userId,
      currentTopicQuery,
      '',
      '',
    );
  const currentTopicComponentInfo = get(userCurrentTopicComponentStatusRes, 'data.userCurrentTopicComponentStatuses[0]');
  const { quizAction, quizQuestions } = input;
  const {
    id: currentTopicComponentId,
    currentTopicComponentType: currentTopicComponent,
    currentTopic,
  } = currentTopicComponentInfo;
  const userQuizQueryRes = await callGraphqlApi(await userQuizQuery(userId, topicId));
  const userQuizInfo = get(userQuizQueryRes, 'data.userQuizs[0]');
  const nextTopicId = get(userQuizInfo, 'nextComponent.topic.id');
  const { id: userQuizId } = userQuizInfo;
  if (!currentTopic) {
    log('Not able to fetch currentTopic in addUserActivityQuizDumpPostHookMethod');
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'CurrentTopicComponentInfo.CurrentTopic: is not present',
      },
    });
  }
  if (!currentTopicComponent) {
    log('Not able to fetch currentTopicComponent in addUserActivityQuizDumpPostHookMethod');
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'CurrentTopicComponentInfo.CurrentTopicComponentType: is not present',
      },
    });
  }
  const { id: currentTopicId } = currentTopic;
  if (quizAction === next &&
      currentTopicComponent === quiz &&
      currentTopicId === topicId &&
      nextTopicId
  ) {
    const learningObjectiveConnectId = get(userQuizInfo, 'nextComponent.topic.learningObjectives[0].id');
    let loQuery = '';
    if (learningObjectiveConnectId) { loQuery = `currentLearningObjectiveConnectId:"${learningObjectiveConnectId}"`; }
    // updating current component in case quiz is completed by user
    await callGraphqlApi(await updateUserCurrentTopicComponentStatusMutation(
      currentTopicComponentId,
      nextTopicId,
      loQuery,
    ));
  }
  if (!quizQuestions || !quizQuestions.length) {
    log('QuizQuestions are not present in input in addUserActivityQuizDumpPostHookMethod');
    throw new QuizQuestionsNotPresentError();
  }
  // code to evaluate report of quiz
  let questionIdsQuery = '[';
  if (quizAction === next) {
    quizQuestions.forEach((quizQuestion) => {
      const questionId = get(quizQuestion, 'question.typeId');
      if (questionId) {
        questionIdsQuery += `"${questionId}", `;
      }
    });
    questionIdsQuery += ']';
    const questionBankQueryRes = await callGraphqlApi(await questionBankQuery(questionIdsQuery));
    const questionBankInfo = get(questionBankQueryRes, 'data.questionBanks');
    const learningObjectiveReportObject = {};
    // Initializing quiz report
    const quizReport = {
      totalQuestionCount: 0,
      correctQuestionCount: 0,
      inCorrectQuestionCount: 0,
      unansweredQuestionCount: 0,
    };
    // quizReport.totalQuestionCount = 0;
    // quizReport.correctQuestionCount = 0;
    // quizReport.inCorrectQuestionCount = 0;
    // quizReport.unansweredQuestionCount = 0;
    const loArray = [];
    let pushManyQuery = 'quiz:{ pushMany: [';
    quizQuestions.forEach((quizQuestion) => {
      const currentQuestionId = get(quizQuestion, 'question.typeId');
      questionBankInfo.forEach((questionBank) => {
        const { id: questionBankId } = questionBank;
        // iterating over questions from input and question bank and
        // comparing for same question and evaluating if it is correct
        if (currentQuestionId === questionBankId) {
          quizReport.totalQuestionCount += 1;
          pushManyQuery += `{ questionConnectId: "${currentQuestionId}", `;
          const { questionType, isAttempted } = questionBank;
          if (isAttempted) {
            pushManyQuery += `isAttempted: ${isAttempted}, `;
          }
          const { questionDisplayOrder } = quizQuestion;
          if (questionDisplayOrder) {
            pushManyQuery += `questionDisplayOrder: ${questionDisplayOrder}, `;
          }
          const loId = get(questionBank, 'learningObjective.id');
          // initializing learning objective report it is not already populated
          if (!learningObjectiveReportObject[loId]) {
            loArray.push(loId);
            learningObjectiveReportObject[loId] = {
              totalQuestionCount: 0,
              correctQuestionCount: 0,
              inCorrectQuestionCount: 0,
              unansweredQuestionCount: 0,
              learningObjective: loId,
            };
            // learningObjectiveReportObject[loId].totalQuestionCount = 0;
            // learningObjectiveReportObject[loId].correctQuestionCount = 0;
            // learningObjectiveReportObject[loId].inCorrectQuestionCount = 0;
            // learningObjectiveReportObject[loId].unansweredQuestionCount = 0;
            // learningObjectiveReportObject[loId].learningObjective = loId;
          }
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
          let isCorrect;
          let userStatement;
          let isOptionSelected;
          let statement;
          let isOptionCorrect;
          let userStatementPosition;
          let optionCorrectPositions;
          let optionPosition;
          let userAnswer;
          let answers;
          // checking question type and checking for correctness
          switch (questionType) {
            case questionTypes.mcq:
              if (mcqOptions) {
                isCorrect = true;
                let userMcqQuery = 'userMcqAnswer: [';
                let mcqOptionQuery = 'mcqOptions: [';
                mcqOptions.forEach((mcqOption) => {
                  statement = get(mcqOption, 'statement');
                  isOptionCorrect = get(mcqOption, 'isCorrect');
                  userMcqAnswers.forEach((userMcqAnswer) => {
                    if (isAttempted && userMcqAnswers) {
                      userStatement = get(userMcqAnswer, 'statement');
                      isOptionSelected = get(userMcqAnswer, 'isSelected');
                      if (userStatement === statement) {
                        userMcqQuery += `{statement: "${userStatement}", `;
                        userMcqQuery += `isSelected: ${isOptionSelected}}, `;
                        if (isOptionSelected !== isOptionCorrect) {
                          isCorrect = false;
                        }
                      }
                    } else {
                      isCorrect = false;
                    }
                  });
                  mcqOptionQuery += `{statement: "${statement}", `;
                  mcqOptionQuery += `isCorrect: ${isOptionCorrect}}, `;
                });
                userMcqQuery += ']';
                mcqOptionQuery += ']';
                pushManyQuery += `isCorrect: ${isCorrect},
                                          ${userMcqQuery}
                                          ${mcqOptionQuery}
                                         `;
              }
              break;
            case questionTypes.fibBlock:
              if (fibBlocksOptions) {
                isCorrect = true;
                let userFibBlockQuery = 'userFibBlockAnswer: [';
                let fibBlockOptionQuery = 'fibBlocksOptions: [';
                fibBlocksOptions.forEach((fibBlocksOption) => {
                  statement = get(fibBlocksOption, 'statement');
                  optionCorrectPositions = get(fibBlocksOption, 'correctPositions');
                  userFibBlockAnswers.forEach((userFibBlockAnswer) => {
                    if (isAttempted && userFibBlockAnswers) {
                      userStatement = get(userFibBlockAnswer, 'statement');
                      userStatementPosition = get(userFibBlockAnswer, 'position');
                      if (userStatement === statement) {
                        userFibBlockQuery += `{statement: "${userStatement}", `;
                        userFibBlockQuery += `position: ${userStatementPosition}}, `;
                        if (optionCorrectPositions.indexOf(userStatementPosition) === -1) {
                          isCorrect = false;
                        }
                      }
                    } else {
                      isCorrect = false;
                    }
                  });
                  let correctPositionsQuery = '[';
                  optionCorrectPositions.forEach((optionCorrectPosition) => {
                    correctPositionsQuery += `${optionCorrectPosition}, `;
                  });
                  correctPositionsQuery += ']';
                  fibBlockOptionQuery += `{statement: "${statement}", `;
                  fibBlockOptionQuery += `correctPositions: ${correctPositionsQuery}}, `;
                });
                userFibBlockQuery += ']';
                fibBlockOptionQuery += ']';
                pushManyQuery += `isCorrect: ${isCorrect},
                                          ${userFibBlockQuery}
                                          ${fibBlockOptionQuery}
                                         `;
              }
              break;
            case questionTypes.fibInput:
              if (fibInputOptions) {
                isCorrect = true;
                let userFibInputQuery = 'userFibInputAnswer: [';
                let fibInputOptionQuery = 'fibInputOptions: [';
                fibInputOptions.forEach((fibInputOption) => {
                  answers = get(fibInputOption, 'answers');
                  optionPosition = get(fibInputOption, 'correctPosition');
                  userFibInputAnswers.forEach((userFibInputAnswer) => {
                    if (isAttempted && userFibInputAnswers) {
                      userAnswer = get(userFibInputAnswer, 'answer');
                      userStatementPosition = get(userFibInputAnswer, 'position');
                      if (userStatementPosition === optionPosition) {
                        userFibInputQuery += `{answer: "${userAnswer}", `;
                        userFibInputQuery += `position: ${userStatementPosition}}, `;
                        if (answers.indexOf(userAnswer) === -1) {
                          isCorrect = false;
                        }
                      }
                    } else {
                      isCorrect = false;
                    }
                  });
                  let answersQuery = '[';
                  answers.forEach((answer) => {
                    answersQuery += `"${answer}", `;
                  });
                  answersQuery += ']';
                  fibInputOptionQuery += `{correctPosition: ${optionPosition}, `;
                  fibInputOptionQuery += `answers: ${answersQuery}}, `;
                });
                userFibInputQuery += ']';
                fibInputOptionQuery += ']';
                pushManyQuery += `isCorrect: ${isCorrect},
                                          ${userFibInputQuery}
                                          ${fibInputOptionQuery}
                                         `;
              }
              break;
            case questionTypes.arrange:
              if (arrangeOptions) {
                isCorrect = true;
                let userArrangeQuery = 'userArrangeAnswer: [';
                let arrangeOptionsQuery = 'arrangeOptions: [';
                arrangeOptions.forEach((arrangeOption) => {
                  statement = get(arrangeOption, 'statement');
                  optionPosition = get(arrangeOption, 'correctPosition');
                  userArrangeAnswers.forEach((userArrangeAnswer) => {
                    if (isAttempted && userArrangeAnswers) {
                      userStatement = get(userArrangeAnswer, 'statement');
                      userStatementPosition = get(userArrangeAnswer, 'position');
                      if (userStatement === statement) {
                        userArrangeQuery += `{statement: "${userStatement}", `;
                        userArrangeQuery += `order: ${userStatementPosition}}, `;
                        if (userStatementPosition !== optionPosition) {
                          isCorrect = false;
                        }
                      }
                    } else {
                      isCorrect = false;
                    }
                  });
                  arrangeOptionsQuery += `{statement: "${statement}", `;
                  arrangeOptionsQuery += `correctPosition: ${optionPosition}}, `;
                });
                userArrangeQuery += ']';
                arrangeOptionsQuery += ']';
                pushManyQuery += `isCorrect: ${isCorrect},
                                          ${userArrangeQuery}
                                          ${arrangeOptionsQuery}
                                         `;
              }
              break;
            default:
          }
          pushManyQuery += '}, ';
          // calculating quiz report lo wise and topic wise on basis of
          // isAttempted and isCorrect
          learningObjectiveReportObject[loId].totalQuestionCount += 1;
          if (!isAttempted) {
            learningObjectiveReportObject[loId].unansweredQuestionCount += 1;
            quizReport.unansweredQuestionCount += 1;
          }
          if (isCorrect) {
            learningObjectiveReportObject[loId].correctQuestionCount += 1;
            quizReport.correctQuestionCount += 1;
          }
          if (isAttempted && !isCorrect) {
            learningObjectiveReportObject[loId].inCorrectQuestionCount += 1;
            quizReport.inCorrectQuestionCount += 1;
          }
          // commented code for calculating quiz lo report accuracy
          // const loTotalQuestionCount =
          // learningObjectiveReportObject[loId].totalQuestionCount;
          // const loCorrectQuestionCount =
          //   learningObjectiveReportObject[loId].correctQuestionCount;
          // if (loTotalQuestionCount > 0) {
          //   learningObjectiveReportObject[loId].accuracy =
          //     (loCorrectQuestionCount / loTotalQuestionCount) * 100;
          // }
        }
      });
    });
    const {
      totalQuestionCount: totalQuestionCountQuizReport,
      inCorrectQuestionCount: inCorrectQuestionCountQuizReport,
      correctQuestionCount: correctQuestionCountQuizReport,
      unansweredQuestionCount: unansweredQuestionCountQuizReport,
    } = quizReport;
    const quizReportQuery = `quizReport:{
                                    totalQuestionCount: ${totalQuestionCountQuizReport}
                                    inCorrectQuestionCount: ${inCorrectQuestionCountQuizReport}
                                    correctQuestionCount: ${correctQuestionCountQuizReport}
                                    unansweredQuestionCount: ${unansweredQuestionCountQuizReport}
                                  }`;
    let learningObjectiveReportQuery = 'learningObjectiveReport: [';
    // creating lo report query on basis of objects in loArray
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
    pushManyQuery += ']}';
    let popAllQuery = '';
    // popping all the existing value present in quiz
    popAllQuery = `quiz:{
                     popAll: true
                   }`;
    if (!userQuizId) {
      log('Not able to fetch userQuizId in addUserActivityQuizDumpPostHookMethod');
      throw new DatabaseRecordNotFoundError({
        data: {
          error: 'UserQuizId: is not present',
        },
      });
    }
    // updating UserQuiz
    await callGraphqlApi(await updateUserQuizMutation(userQuizId, popAllQuery));
    await callGraphqlApi(await updateUserQuizMutationQuiz(userQuizId, pushManyQuery));
    // generating quiz report of user
    await callGraphqlApi(await addUserQuizReport(
      userId,
      topicId,
      quizReportQuery,
      learningObjectiveReportQuery,
    ));

    // logic for evaluating scholarship of user
    // and it will be done on first attempt of quiz
    if (currentTopicComponent === quiz &&
        currentTopicId === topicId) {
      // code for calculating total quiz report accuracy for scholarship
      const { totalQuestionCount, correctQuestionCount } = quizReport;
      let topicsCompleted = 0;
      let proficientTopicCount = 0;
      let masteredTopicCount = 0;
      let familiarTopicCount = 0;
      let freeProficientTopicCount = freeTopicCount;
      let freeMasteredTopicCount = freeTopicCount;
      let freeFamiliarTopicCount = freeTopicCount;
      let accuracy = 0;
      if (totalQuestionCount > 0) {
        accuracy =
            (correctQuestionCount / totalQuestionCount) * 100;
      }
      const userProfileResult = await callGraphqlApi(await userProfileQuery(userId));
      const userProfileInfo = get(userProfileResult, 'data.userProfiles[0]');
      const userProfileId = get(userProfileInfo, 'id');
      if (userProfileInfo) {
        const {
          topicsCompleted: topicsCompletedInUserProfile,
          proficientTopicCount: proficientTopicCountInUserProfile,
          freeProficientTopicCount: freeProficientTopicCountInUserProfile,
          masteredTopicCount: masteredTopicCountInUserProfile,
          freeMasteredTopicCount: freeMasteredTopicCountInUserProfile,
          familiarTopicCount: familiarTopicCountInUserProfile,
          freeFamiliarTopicCount: freeFamiliarTopicCountInUserProfile,
        } = userProfileInfo;
        if (topicsCompletedInUserProfile) {
          topicsCompleted = topicsCompletedInUserProfile;
        }
        if (proficientTopicCountInUserProfile) {
          proficientTopicCount = proficientTopicCountInUserProfile;
        }
        if (freeProficientTopicCountInUserProfile) {
          freeProficientTopicCount = freeProficientTopicCountInUserProfile;
        }
        if (masteredTopicCountInUserProfile) {
          masteredTopicCount = masteredTopicCountInUserProfile;
        }
        if (freeMasteredTopicCountInUserProfile) {
          freeMasteredTopicCount = freeMasteredTopicCountInUserProfile;
        }
        if (familiarTopicCountInUserProfile) {
          familiarTopicCount = familiarTopicCountInUserProfile;
        }
        if (freeFamiliarTopicCountInUserProfile) {
          freeFamiliarTopicCount = freeFamiliarTopicCountInUserProfile;
        }
      }
      let userProfileTopicConnectQuery = '';
      const { proficient, master, familiar } = scholarshipThreshHolds;
      topicsCompleted += 1;
      // proficient topic logic
      if (accuracy === proficient) {
        proficientTopicCount += 1;
        userProfileTopicConnectQuery += `proficientTopicsConnectIds:["${topicId}"] `;
      } else if (freeProficientTopicCount > 0) {
        freeProficientTopicCount -= 1;
      }
      // mastered topic logic
      if (accuracy > master) {
        masteredTopicCount += 1;
        userProfileTopicConnectQuery += `masteredTopicsConnectIds:["${topicId}"] `;
      } else if (freeMasteredTopicCount > 0) {
        freeMasteredTopicCount -= 1;
      }
      // familiar topic logic
      if (accuracy > familiar) {
        familiarTopicCount += 1;
        userProfileTopicConnectQuery += `familiarTopicsConnectIds:["${topicId}"] `;
      } else if (freeFamiliarTopicCount > 0) {
        freeFamiliarTopicCount -= 1;
      }

      if (userProfileId) {
        await callGraphqlApi(await updateUserProfile(
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
      } else {
        await callGraphqlApi(await addUserProfile(
          userId,
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
    }
  }
  return true;
};

export default addUserActivityQuizDumpPostHookMethod;

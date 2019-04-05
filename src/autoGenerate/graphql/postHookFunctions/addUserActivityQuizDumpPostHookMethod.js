import { get } from 'lodash';
import callGraphqlApi from '../../../api/callGraphqlApi';
import {
  topicTypes, freeTopicCount,
  GLOBAL_COURSE_ID, PUBLISHED, questionTypes, scholarshipThreshHolds,
  userActionType,
  userTopicTypeStatus,
} from '../../../../constants';

// query to get current component status of user
const userCurrentTopicComponentStatusQuery = async userId => `
  query{
    userCurrentTopicComponentStatuses(filter:{
      and:[
        {user_some:{
        id:"${userId}"
        }},
      {currentCourse_some:{
        and:[
          {status: published},
          {id:"${GLOBAL_COURSE_ID}"}
          {chapters_some:{
            status: published
          }}
        ]
      }}
      ]
    }){
      id
      user{
        id
        username
      }
      currentTopic{
        id
        order
      }
      currentTopicComponentType
      enrollmentType
    }
  }
  `;

/*
query to get topic and it's first lo to get populated in user topic current component status
we use order of topic to fetch the document
*/
const nextTopicQuery = async nextTopicOrder => `
  query{
    topics(filter:{
      and:[
      {order:${nextTopicOrder}},
      {status: ${PUBLISHED}}
    ]
    }){
      id
      learningObjectives(filter:{
        order: 1
      }){
        id
      }
    }
  }
`;

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
  if (userId && topicId) {
    let nextTopicId;
    const userCurrentTopicComponentStatusRes =
      await callGraphqlApi(await userCurrentTopicComponentStatusQuery(userId));
    const currentTopicComponentInfo = get(userCurrentTopicComponentStatusRes, 'data.userCurrentTopicComponentStatuses[0]');
    const quizAction = get(input, 'quizAction');
    const {
      id: currentTopicComponentId,
      currentTopicComponentType: currentTopicComponent,
      currentTopic,
    } = currentTopicComponentInfo;
    if (currentTopicComponent &&
      currentTopic &&
      quizAction === userActionType.next &&
      currentTopicComponent === topicTypes.quiz &&
      currentTopic.id === topicId
    ) {
      const currentTopicOrder = currentTopic.order;
      if (currentTopicOrder) {
        const nextTopicOrder = currentTopic.order + 1;
        const nextTopicResult = await callGraphqlApi(await nextTopicQuery(nextTopicOrder));
        const nextTopicInfo = get(nextTopicResult, 'data.topics[0]');
        nextTopicId = get(nextTopicInfo, 'id');
        const learningObjectiveConnectId = get(nextTopicInfo, 'learningObjectives[0].id');
        let loQuery = '';
        if (learningObjectiveConnectId) { loQuery = `currentLearningObjectiveConnectId:"${learningObjectiveConnectId}"`; }
        // updating current component in case quiz is completed by user
        if (nextTopicId) {
          await callGraphqlApi(await updateUserCurrentTopicComponentStatusMutation(
            currentTopicComponentId,
            nextTopicId,
            loQuery,
          ));
        }
      }
    }

    const userQuizQueryRes = await callGraphqlApi(await userQuizQuery(userId, topicId));
    const userQuizInfo = get(userQuizQueryRes, 'data.userQuizs[0]');
    const userQuizId = get(userQuizInfo, 'id');
    // code to evaluate report of quiz
    const quizQuestions = get(input, 'quizQuestions');
    let questionIdsQuery = '[';
    if (quizAction === userActionType.next &&
      quizQuestions.length) {
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
      const quizReport = {};
      quizReport.totalQuestionCount = 0;
      quizReport.correctQuestionCount = 0;
      quizReport.inCorrectQuestionCount = 0;
      quizReport.unansweredQuestionCount = 0;
      const loArray = [];
      let pushManyQuery = 'quiz:{ pushMany: [';
      quizQuestions.forEach((quizQuestion) => {
        const currentQuestionId = get(quizQuestion, 'question.typeId');
        questionBankInfo.forEach((questionBank) => {
          const questionBankId = get(questionBank, 'id');
          // iterating over questions from input and question bank and
          // comparing for same question and evaluating if it is correct
          if (currentQuestionId === questionBankId) {
            quizReport.totalQuestionCount += 1;
            pushManyQuery += `{ questionConnectId: "${currentQuestionId}", `;
            const questionType = get(questionBank, 'questionType');
            const isAttempted = get(quizQuestion, 'isAttempted');
            if (isAttempted) {
              pushManyQuery += `isAttempted: ${isAttempted}, `;
            }
            const questionDisplayOrder = get(quizQuestion, 'questionDisplayOrder');
            if (questionDisplayOrder) {
              pushManyQuery += `questionDisplayOrder: ${questionDisplayOrder}, `;
            }
            const loId = get(questionBank, 'learningObjective.id');
            // initializing learning objective report it is not already populated
            if (!learningObjectiveReportObject[loId]) {
              loArray.push(loId);
              learningObjectiveReportObject[loId] = {};
              learningObjectiveReportObject[loId].totalQuestionCount = 0;
              learningObjectiveReportObject[loId].correctQuestionCount = 0;
              learningObjectiveReportObject[loId].inCorrectQuestionCount = 0;
              learningObjectiveReportObject[loId].unansweredQuestionCount = 0;
              learningObjectiveReportObject[loId].learningObjective = loId;
            }
            const userMcqAnswers = get(quizQuestion, 'userMcqAnswer');
            const mcqOptions = get(questionBank, 'mcqOptions');
            const userFibBlockAnswers = get(quizQuestion, 'userFibBlockAnswer');
            const fibBlocksOptions = get(questionBank, 'fibBlocksOptions');
            const userFibInputAnswers = get(quizQuestion, 'userFibInputAnswer');
            const fibInputOptions = get(questionBank, 'fibInputOptions');
            const userArrangeAnswers = get(quizQuestion, 'userArrangeAnswer');
            const arrangeOptions = get(questionBank, 'arrangeOptions');
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
                          if (isOptionSelected !== isOptionCorrect) { isCorrect = false; }
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
                          if (userStatementPosition !== optionPosition) { isCorrect = false; }
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
      const quizReportQuery = `quizReport:{
                                    totalQuestionCount: ${quizReport.totalQuestionCount}
                                    inCorrectQuestionCount: ${quizReport.inCorrectQuestionCount}
                                    correctQuestionCount: ${quizReport.correctQuestionCount}
                                    unansweredQuestionCount: ${quizReport.unansweredQuestionCount}
                                  }`;
      let learningObjectiveReportQuery = 'learningObjectiveReport: [';
      // creating lo report query on basis of objects in loArray
      loArray.forEach((loIdInArray) => {
        learningObjectiveReportQuery += `{
                                    totalQuestionCount: ${learningObjectiveReportObject[loIdInArray].totalQuestionCount}
                                    inCorrectQuestionCount: ${learningObjectiveReportObject[loIdInArray].inCorrectQuestionCount}
                                    correctQuestionCount: ${learningObjectiveReportObject[loIdInArray].correctQuestionCount}
                                    unansweredQuestionCount: ${learningObjectiveReportObject[loIdInArray].unansweredQuestionCount}
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

      if (userQuizId) {
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
        if (currentTopicComponent === topicTypes.quiz &&
          currentTopic.id === topicId) {
          // code for calculating total quiz report accuracy for scholarship
          const totalQuestionCount = quizReport.totalQuestionCount;
          const correctQuestionCount = quizReport.correctQuestionCount;
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
          if (userProfileInfo && userProfileInfo.topicsCompleted) {
            topicsCompleted = userProfileInfo.topicsCompleted;
          }
          if (userProfileInfo && userProfileInfo.proficientTopicCount) {
            proficientTopicCount = userProfileInfo.proficientTopicCount;
          }
          if (userProfileInfo && userProfileInfo.freeProficientTopicCount) {
            freeProficientTopicCount = userProfileInfo.freeProficientTopicCount;
          }
          if (userProfileInfo && userProfileInfo.masteredTopicCount) {
            masteredTopicCount = userProfileInfo.masteredTopicCount;
          }
          if (userProfileInfo && userProfileInfo.freeMasteredTopicCount) {
            freeMasteredTopicCount = userProfileInfo.freeMasteredTopicCount;
          }
          if (userProfileInfo && userProfileInfo.familiarTopicCount) {
            familiarTopicCount = userProfileInfo.familiarTopicCount;
          }
          if (userProfileInfo && userProfileInfo.freeFamiliarTopicCount) {
            freeFamiliarTopicCount = userProfileInfo.freeFamiliarTopicCount;
          }
          let userProfileTopicConnectQuery = '';
          topicsCompleted += 1;
          // proficient topic logic
          if (accuracy === scholarshipThreshHolds.proficient) {
            proficientTopicCount += 1;
            userProfileTopicConnectQuery += `proficientTopicsConnectIds:["${topicId}"] `;
          } else if (freeProficientTopicCount > 0) {
            freeProficientTopicCount -= 1;
          }
          // mastered topic logic
          if (accuracy > scholarshipThreshHolds.master) {
            masteredTopicCount += 1;
            userProfileTopicConnectQuery += `masteredTopicsConnectIds:["${topicId}"] `;
          } else if (freeMasteredTopicCount > 0) {
            freeMasteredTopicCount -= 1;
          }
          // familiar topic logic
          if (accuracy > scholarshipThreshHolds.familiar) {
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
    }
  }
};

export default addUserActivityQuizDumpPostHookMethod;

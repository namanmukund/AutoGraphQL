import { get } from 'lodash';
import callGraphqlApi from '../../../api/callGraphqlApi';
import {
  componentTypes, freeTopicCount,
  GLOBAL_COURSE_ID, PUBLISHED, questionTypes, scholarshipThreshHolds,
  userActionType,
  userComponentStatus,
} from '../../../../constants';

const addUserActivityQuizDumpPostHookMethod = async (input) => {
  const userId = get(input, 'user.typeId');
  const topicId = get(input, 'topic.typeId');
  if (userId && topicId) {
    // query to get current component status of user
    let nextTopicId;
    const userCurrentComponentStatusQuery = `
          query{
            userCurrentComponentStatuses(filter:{
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
              currentComponentType
              enrollmentType
            }
          }
          `;
    const userCurrentComponentStatusRes = await callGraphqlApi(userCurrentComponentStatusQuery);
    const currentComponentInfo = get(userCurrentComponentStatusRes, 'data.userCurrentComponentStatuses[0]');
    const quizAction = get(input, 'quizAction');
    const {
      id: currentComponentId,
      currentComponentType: currentComponent,
      currentTopic,
    } = currentComponentInfo;
    if (currentComponent &&
      currentTopic &&
      quizAction === userActionType.next &&
      currentComponent === componentTypes.quiz &&
      currentTopic.id === topicId
    ) {
      const currentTopicOrder = currentTopic.order;
      if (currentTopicOrder) {
        const nextTopicOrder = currentTopic.order + 1;
        // query to get next topic
        const nextTopicQuery = `
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
        const nextTopicResult = await callGraphqlApi(nextTopicQuery);
        const nextTopicInfo = get(nextTopicResult, 'data.topics[0]');
        nextTopicId = get(nextTopicInfo, 'id');
        const learningObjectiveConnectId = get(nextTopicInfo, 'learningObjectives[0].id');
        let loQuery = '';
        if (learningObjectiveConnectId) { loQuery = `currentLearningObjectiveConnectId:"${learningObjectiveConnectId}"`; }
        // updating current component in case quiz is completed by user
        if (nextTopicId) {
          const updateUserCurrentComponentStatusMutation = `
              mutation{
                updateUserCurrentComponentStatus(id:"${currentComponentId}",  input:{
                  currentComponentType: ${componentTypes.video}
                },
                currentTopicConnectId:"${nextTopicId}"
                ${loQuery}
                ){
                  id
                }
              }
              `;
          await callGraphqlApi(updateUserCurrentComponentStatusMutation);
        }
      }
    }

    const userQuizQuery = `
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
                  quizStatus: ${userComponentStatus.incomplete}
                }
              ]
            }){
              id
              quizStatus
            }
          }
          `;
    const userQuizQueryRes = await callGraphqlApi(userQuizQuery);
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
      // getting questions from question bank to evaluate quiz report
      const questionBankQuery = `
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
      const questionBankQueryRes = await callGraphqlApi(questionBankQuery);
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
        // popping all the existing value present in quiz
        const updateUserQuizMutation = `
            mutation{
              updateUserQuiz(id:"${userQuizId}",  input:{
                quizStatus: ${userComponentStatus.complete}
                ${popAllQuery}
              }){
                id
              }
            }
            `;
        await callGraphqlApi(updateUserQuizMutation);

        // pushing all the questions with result in the collection
        const updateUserQuizMutationQuiz = `
              mutation{
                updateUserQuiz(id:"${userQuizId}",  input:{
                  ${pushManyQuery}
                }){
                  id
                }
              }
              `;
        await callGraphqlApi(updateUserQuizMutationQuiz);

        // generating quiz report of user
        const addUserQuizReport = `
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
        await callGraphqlApi(addUserQuizReport);

        // logic for evaluating scholarship of user
        // and it will be done on first attempt of quiz
        if (currentComponent === componentTypes.quiz &&
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
          const userProfileQuery = `
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
          const userProfileResult = await callGraphqlApi(userProfileQuery);
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
            const updateUserProfile = `
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
            await callGraphqlApi(updateUserProfile);
          } else {
            const addUserProfile = `
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
            await callGraphqlApi(addUserProfile);
          }
        }
      }
    }
  }
};

export default addUserActivityQuizDumpPostHookMethod;

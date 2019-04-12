import { get } from 'lodash';
import callGraphqlApi from '../../../api/callGraphqlApi';
import {
  topicTypes,
  PUBLISHED, questionTypes, scholarshipThreshHolds,
  userActionType,
  userTopicTypeStatus,
} from '../../../../constants';
import { log } from '../../../../utils';
import {
  DatabaseRecordNotFoundError,
  QuizQuestionsNotPresentError,
} from '../../../../constants/errors';

// query to update user current topic component status
const updateUserCurrentTopicComponentStatusMutation = (
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
const userQuizQuery = (
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
        quiz{
          question{
            id
          }
        }
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
const updateUserQuizMutation = userQuizId => `
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
) => `
  mutation{
    addUserQuizReport(
    userConnectId: "${userId}"
    topicConnectId: "${topicId}"
    input:{
      ${quizReportQuery}
      ${learningObjectiveReportQuery}
      ${pushManyQuery}
    }){
      id
    }
  }
  `;

// query to get current user profile to get current scholarship status
const userProfileQuery = userId => `
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
  if (!userId || !topicId) {
    log('Either one of userId or topicId is missing in input of addUserActivityQuizDumpPostHookMethod');
  }
  const { next } = userActionType;
  const { quiz } = topicTypes;
  /*
  Getting data for user current topic component status from context based on mutationName
  This will be used to cover the case that current component status will only get changed, if
  called component is equal to current component and user has just consumed(next action) it
  And current component status will not get changed when it is already consumed in past
  */
  const currentTopicComponentInfo = get(context, `${mutationName}.userCurrentTopicComponentStatuses`);
  const { quizAction, quizQuestions } = input;
  const {
    id: currentTopicComponentId,
    currentTopicComponentType: currentTopicComponent,
    currentTopic,
  } = currentTopicComponentInfo;
  /*
  we are getting userQuiz for below purpose:
  -we get userQuiz id , which will be used further to update the document
  -we get next component from the document and update user current topic component status with same
  */
  const userQuizQueryRes = await callGraphqlApi(userQuizQuery(userId, topicId));
  const userQuizInfo = get(userQuizQueryRes, 'data.userQuizs[0]');
  const quizQuestionsInUserQuiz = get(userQuizInfo, 'quiz');
  const nextTopicId = get(userQuizInfo, 'nextComponent.topic.id');
  const { id: userQuizId } = userQuizInfo;
  if (!currentTopic) {
    log('Not able to fetch CurrentTopicComponentInfo.currentTopic in addUserActivityQuizDumpPostHookMethod');
  }
  if (!currentTopicComponent) {
    log('Not able to fetch CurrentTopicComponentInfo.CurrentTopicComponentType in addUserActivityQuizDumpPostHookMethod');
  }
  const { id: currentTopicId } = currentTopic;
  /*
  We are checking whether user current topic status should be updated, below are the conditions:
  -user is hitting next and
  -current topic component should be 'quiz'
  -called topic in input should be equal to current topic and
  -next published topic is present in the database, if it is not present we are assuming that it
  -was the last topic in the course
  Above conditions covers the case that current component status will only get changed, if
  called component is  is equal to current component and user has just consumed(next action) it
  And current component status will not get changed when it is already consumed in past
  */
  if (quizAction === next &&
      currentTopicComponent === quiz &&
      currentTopicId === topicId &&
      nextTopicId
  ) {
    const learningObjectiveConnectId = get(userQuizInfo, 'nextComponent.topic.learningObjectives[0].id');
    let loQuery = '';
    if (learningObjectiveConnectId) { loQuery = `currentLearningObjectiveConnectId:"${learningObjectiveConnectId}"`; }
    // updating current component in case quiz is completed by user
    await callGraphqlApi(updateUserCurrentTopicComponentStatusMutation(
      currentTopicComponentId,
      nextTopicId,
      loQuery,
    ));
  }
  // throwing error if client has not send any question in input
  if (!quizQuestions || !quizQuestions.length) {
    log('QuizQuestions are not present in input in addUserActivityQuizDumpPostHookMethod');
    throw new QuizQuestionsNotPresentError();
  }
  // throwing error if there are no published questions in database
  if (!quizQuestionsInUserQuiz ||
    !quizQuestionsInUserQuiz.length) {
    log('Quiz Questions are not present in UserQuiz in addUserActivityQuizDumpPostHookMethod');
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'Topic.QuizQuestions: is not present',
      },
    });
  }
  // code to evaluate report of quiz
  let questionIdsQuery = '[';
  /*
  Quiz report will only get created when user hits next after completing quiz
  In case user closes app in between quiz, he will have to give whole quiz again
  And there will be no record present for abandoned quiz in DB as well
  */
  if (quizAction === next) {
    const totalQuestions = quizQuestionsInUserQuiz.length;
    let questionsInInput = 0;
    /*
    Creating quiz question query with all questions in quiz to fetch them from
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
      totalQuestionCount: 0,
      correctQuestionCount: 0,
      inCorrectQuestionCount: 0,
      unansweredQuestionCount: 0,
    };
    // Remove this after review and testing
    // quizReport.totalQuestionCount = 0;
    // quizReport.correctQuestionCount = 0;
    // quizReport.inCorrectQuestionCount = 0;
    // quizReport.unansweredQuestionCount = 0;
    const loArray = [];
    /*
    pushMany query to store user's answer and correct answer in User quiz report
    quiz field will be used by client when user hits view answers on report page
    And it will get genrated for each report(when user hits next)
    */
    let pushManyQuery = 'quizAnswers:[';
    /*
    Iterating over each quiz question from input and will update question in
    userQuizReport on basis of input(isCorrect, isAttempted etc.)
    */
    quizQuestions.forEach((quizQuestion) => {
      const currentQuestionId = get(quizQuestion, 'question.typeId');
      /*
      We get quiz questions from Question Bank and iterate on each one of them and
      use them to know the correct answer of questions, question type etc.
      */
      questionBankInfo.forEach((questionBank) => {
        const { id: questionBankId } = questionBank;
        /*
        iterating over questions from input and question bank and
        comparing for same question and evaluating if it is correct
        */
        if (currentQuestionId === questionBankId) {
          // this field will be used for validation if all questions present in userQuiz is
          // sent by client
          questionsInInput += 1;
          quizReport.totalQuestionCount += 1;
          pushManyQuery += `{ questionConnectId: "${currentQuestionId}", `;
          const { questionType } = questionBank;
          const { isAttempted, questionDisplayOrder } = quizQuestion;
          if (questionDisplayOrder) {
            pushManyQuery += `questionDisplayOrder: ${questionDisplayOrder}, `;
          }
          if (isAttempted) {
            pushManyQuery += `isAttempted: ${isAttempted}, `;
          }
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
            // remove after review and testing
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
            case questionTypes.mcq:
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
                mcqOptions.forEach((mcqOption) => {
                  statement = get(mcqOption, 'statement');
                  isOptionCorrect = get(mcqOption, 'isCorrect');
                  /*
                  Iterating over each option in question in Question Bank and user answer and
                  when statement matches, we are checking if option and user answer match
                  if they do not match setting isCorrect to false
                  similar logic follows for all question types ahead
                  */
                  userMcqAnswers.forEach((userMcqAnswer) => {
                    if (isAttempted && userMcqAnswers) {
                      userStatement = get(userMcqAnswer, 'statement');
                      isOptionSelected = get(userMcqAnswer, 'isSelected');
                      if (userStatement === statement) {
                        userMcqQuery += `{statement: "${userStatement}", `;
                        userMcqQuery += `isSelected: ${isOptionSelected}}, `;
                        // setting isCorrect to false if correct option is not selected
                        if (isOptionSelected !== isOptionCorrect) {
                          isCorrect = false;
                        }
                      }
                    } else {
                      isCorrect = false;
                    }
                  });
                  // constructing query for correct mcqOptions
                  // replicating info from question Bank
                  mcqOptionQuery += `{statement: "${statement}", `;
                  mcqOptionQuery += `isCorrect: ${isOptionCorrect}}, `;
                });
                userMcqQuery += ']';
                mcqOptionQuery += ']';
                pushManyQuery += `isCorrect: ${isCorrect},
                                          ${userMcqQuery}
                                          ${mcqOptionQuery}
                                         `;
              } else {
                log(`mcqOptions are not present for question: ${questionBankId}`);
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
                        // if statement is not present in any of the possible correct positions
                        // setting isCorrect to false
                        if (optionCorrectPositions.indexOf(userStatementPosition) === -1) {
                          isCorrect = false;
                        }
                      }
                    } else {
                      isCorrect = false;
                    }
                  });
                  // constructing query for correct fibBlockOptions
                  // replicating info from question Bank
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
              } else {
                log(`fibBlocksOptions are not present for question: ${questionBankId}`);
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
                        // if user answer doesn't match with any of possible answers for a position
                        // setting isCorrect to false
                        if (answers.indexOf(userAnswer) === -1) {
                          isCorrect = false;
                        }
                      }
                    } else {
                      isCorrect = false;
                    }
                  });
                  // constructing query for correct fibInputOptions
                  // replicating info from question Bank
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
              } else {
                log(`fibInputOptions are not present for question: ${questionBankId}`);
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
                        userArrangeQuery += `position: ${userStatementPosition}}, `;
                        // if statement user order does not match correct order
                        // setting isCorrect to false
                        if (userStatementPosition !== optionPosition) {
                          isCorrect = false;
                        }
                      }
                    } else {
                      isCorrect = false;
                    }
                  });
                  // constructing query for correct arrangeOptions
                  // replicating info from question Bank
                  arrangeOptionsQuery += `{statement: "${statement}", `;
                  arrangeOptionsQuery += `correctPosition: ${optionPosition}}, `;
                });
                userArrangeQuery += ']';
                arrangeOptionsQuery += ']';
                pushManyQuery += `isCorrect: ${isCorrect},
                                          ${userArrangeQuery}
                                          ${arrangeOptionsQuery}
                                         `;
              } else {
                log(`arrangeOptions are not present for question: ${questionBankId}`);
              }
              break;
            default:
          }
          pushManyQuery += '}, ';
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
          // remove commented code after review and testing
          // if (!isAttempted) {
          //   learningObjectiveReportObject[loId].unansweredQuestionCount += 1;
          //   quizReport.unansweredQuestionCount += 1;
          // }
          // if (isAttempted && isCorrect) {
          //   learningObjectiveReportObject[loId].correctQuestionCount += 1;
          //   quizReport.correctQuestionCount += 1;
          // }
          // if (isAttempted && !isCorrect) {
          //   learningObjectiveReportObject[loId].inCorrectQuestionCount += 1;
          //   quizReport.inCorrectQuestionCount += 1;
          // }
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
    // both for loop end here
    // checking if all questions present in userQuiz is sent by client
    if (totalQuestions !== questionsInInput) {
      throw new QuizQuestionsNotPresentError();
    }
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
    if (!userQuizId) {
      log('Not able to fetch userQuizId in addUserActivityQuizDumpPostHookMethod');
    }
    // updating UserQuiz to change status to complete
    await callGraphqlApi(updateUserQuizMutation(userQuizId));
    // generating quiz report of user
    await callGraphqlApi(addUserQuizReport(
      userId,
      topicId,
      quizReportQuery,
      learningObjectiveReportQuery,
      pushManyQuery,
    ));

    /*
    logic for evaluating scholarship of user
    and it will be done only on first attempt of quiz so we are checking if the called topic
    is current topic or not and current topic component should be quiz
    */
    if (currentTopicComponent === quiz &&
        currentTopicId === topicId) {
      // code for calculating total quiz report accuracy for scholarship
      const { totalQuestionCount, correctQuestionCount } = quizReport;
      // remove after review and testing
      // let topicsCompleted = 0;
      // let proficientTopicCount = 0;
      // let masteredTopicCount = 0;
      // let familiarTopicCount = 0;
      // // freeTopicCount is set to 5 in config file
      // let freeProficientTopicCount = freeTopicCount;
      // let freeMasteredTopicCount = freeTopicCount;
      // let freeFamiliarTopicCount = freeTopicCount;
      let accuracy = 0;
      if (totalQuestionCount > 0) {
        accuracy =
            (correctQuestionCount / totalQuestionCount) * 100;
      } else {
        log('There are no questions in quiz. Something is wrong');
      }
      // getting userProfile Data to get current scholarship status of user
      // there is logic in post hook of userProfile to create userProfile with
      // default data if it was not present. So we will always get this
      //
      const userProfileResult = await callGraphqlApi(userProfileQuery(userId));
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

      let userProfileTopicConnectQuery = '';
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
      if (accuracy > master) {
        masteredTopicCount += 1;
        userProfileTopicConnectQuery += `masteredTopicsConnectIds:["${topicId}"] `;
      } else if (freeMasteredTopicCount > 0) {
        freeMasteredTopicCount -= 1;
      }
      // familiar topic logic, familiar is 60 defined in config
      if (accuracy > familiar) {
        familiarTopicCount += 1;
        userProfileTopicConnectQuery += `familiarTopicsConnectIds:["${topicId}"] `;
      } else if (freeFamiliarTopicCount > 0) {
        freeFamiliarTopicCount -= 1;
      }

      // updating user profile
      await callGraphqlApi(updateUserProfile(
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
    // if condition for whether this is user's first attempt for quiz ends here
  }
  // if for user action type== next ends here
  return true;
};

export default addUserActivityQuizDumpPostHookMethod;

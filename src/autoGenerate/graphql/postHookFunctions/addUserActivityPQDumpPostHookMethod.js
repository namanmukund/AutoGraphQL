import { get } from 'lodash';
import callGraphqlApi from '../../../api/callGraphqlApi';
import {
  topicTypes,
  userActionType,
  userTopicTypeStatus,
} from '../../../../constants';
import { log } from '../../../../utils';
import {
  DatabaseRecordNotFoundError,
  PracticeQuestionsNotPresentError,
} from '../../../../constants/errors';

/* query to get userLO to check if document exists for userId and learningObjectiveId
also we are doing computation for chatStatus and next component for this */
const userLearningObjectiveQuery = (userId, learningObjectiveId) => `
  query{
    userLearningObjectives(filter:{
      and:[
        {user_some:{
        id:"${userId}"
        }},
      {learningObjective_some:{
        id:"${learningObjectiveId}"
      }}
      ]
    }){
      id
      practiceQuestionStatus
      practiceQuestions{
        question{
          id
        }
        isHintUsed
        isAnswerUsed
        attemptNumber
        status
      }
      nextComponent{
        learningObjective{
          id
        }
        nextComponentType
      }
    }
  }
  `;

// query to update user current topic component status
const updateUserCurrentTopicComponentStatusMutation = (
  currentTopicComponentId,
  nextCurrentTopicComponentType,
  restUserCurrentTopicComponentStatusQuery,
) => `
  mutation{
    updateUserCurrentTopicComponentStatus(id:"${currentTopicComponentId}",  input:{
      currentTopicComponentType: ${nextCurrentTopicComponentType}
    }
    ${restUserCurrentTopicComponentStatusQuery}
    ){
      id
    }
  }
  `;

// mutation to update User Learning Objective, popping all practice questions
const updateUserLearningObjectiveMutation = (
  userLearningObjectiveId,
  isPracticeQuestionBookmarked,
  practiceQuestionStatus,
  popAllQuery,
) => `
  mutation{
    updateUserLearningObjective(id:"${userLearningObjectiveId}",  input:{
      isPracticeQuestionBookmarked: ${isPracticeQuestionBookmarked}
      practiceQuestionStatus: ${practiceQuestionStatus}
      ${popAllQuery}
    }){
      id
    }
  }
  `;

// mutation to update User Learning Objective, pushing updated practice questions
const updateUserLearningObjectiveMutationPracticeQuestions = (
  userLearningObjectiveId, pushManyQuery) => `
  mutation{
    updateUserLearningObjective(id:"${userLearningObjectiveId}",  input:{
      ${pushManyQuery}
    }){
      id
    }
  }
  `;

// mutation to add UserPracticeQuestionReport
const addUserPracticeQuestionReportMutation = (
  userId,
  learningObjectiveId,
  firstTryCount,
  secondTryCount,
  threeOrMoreTryCount,
  helpUsedCount,
  answerUsedCount,
) => `
  mutation{
    addUserPracticeQuestionReport(
    userConnectId:"${userId}"
    learningObjectiveConnectId:"${learningObjectiveId}"
    input:{
        firstTryCount: ${firstTryCount}
        secondTryCount: ${secondTryCount}
        threeOrMoreTryCount: ${threeOrMoreTryCount}
        helpUsedCount: ${helpUsedCount}
        answerUsedCount: ${answerUsedCount}
    }
  ){
      id
    }
  }
  `;

/*
Current topic component status and
UserLearningObjective(bookmark, practiceQuestionStatus etc) is updated based on-
  -current topic component status
  -user Learning Objective for provided userId and learning objective id
  -learning objectives and topic
*/
const addUserActivityPQDumpPostHookMethod = async (input, mutationName, context) => {
  const userId = get(input, 'user.typeId');
  const learningObjectiveId = get(input, 'learningObjective.typeId');
  if (!userId || !learningObjectiveId) {
    log('Either one of userId or learningObjectiveId is missing in input of addUserActivityPQDumpPostHookMethod');
  }
  const learningObjectiveInfo = get(context, `${mutationName}.learningObjective`);
  const topicId = get(learningObjectiveInfo, 'topic.id');
  const {
    id: learningObjectiveIdInResult,
  } = learningObjectiveInfo;
  /*
  Getting data for user current topic component status from context based on mutationName
  This will be used to cover the case that current component status will only get changed, if
  called component is equal to current component and user has just consumed(next action) it
  And current component status will not get changed when it is already consumed in past
  */
  const currentTopicComponentInfo = get(context, `${mutationName}.userCurrentTopicComponentStatuses`);
  /*
  we are getting userLearningObjective for below purpose:
  -we get userLearningObjective id , which will be used further to update the document
  -we use practiceQuestionStatus to cover the scenario, if user is coming back to a completed pq
    in that case if he is hitting back after pq consumption, status will not get updated
    if it is already completed
  -we get next component from the document and update user current topic component status with same
  */
  const userLearningObjectiveQueryRes = await callGraphqlApi(
    userLearningObjectiveQuery(userId, learningObjectiveId));
  const userLearningObjectiveInfo = get(userLearningObjectiveQueryRes, 'data.userLearningObjectives[0]');
  const {
    id: userLearningObjectiveId,
    practiceQuestionStatus: practiceQuestionStatusBeforeUpdate,
  } = userLearningObjectiveInfo;
  const { next } = userActionType;
  const { complete, incomplete } = userTopicTypeStatus;
  const { message, quiz, practiceQuestion } = topicTypes;
  let practiceQuestionStatus = get(userLearningObjectiveInfo, 'practiceQuestionStatus', incomplete);
  const {
    pqAction,
    isBookmarked: isBookmarkedFromInput,
    practiceQuestionsDump: inputPracticeQuestions,
  } = input;
  const isPracticeQuestionBookmarked = isBookmarkedFromInput || false;
  const {
    id: currentTopicComponentId,
    currentTopicComponentType: currentTopicComponent,
    currentLearningObjective,
    currentTopic,
  } = currentTopicComponentInfo;
  /*
  For next user component topic status, we are using next component stored
  in userLearningObjective document when it was created. Next component here can
  either be chat of next Lo or quiz. Logic for this is already written when
  userLearningObjective document gets created
  */
  const nextComponentLearningObjectiveId = get(userLearningObjectiveInfo, 'nextComponent.learningObjective.id');
  const nextComponentType = get(userLearningObjectiveInfo, 'nextComponent.nextComponentType');
  let nextCurrentTopicComponentType;
  let restUserCurrentTopicComponentStatusQuery = '';
  // logic for checking the next component, it will either be chat of next LO or quiz
  if (nextComponentType === quiz) {
    nextCurrentTopicComponentType = quiz;
  } else if (nextComponentLearningObjectiveId) {
    nextCurrentTopicComponentType = message;
    restUserCurrentTopicComponentStatusQuery = `currentLearningObjectiveConnectId:"${nextComponentLearningObjectiveId}"`;
  }
  if (!currentTopic) {
    log('Not able to fetch CurrentTopicComponentInfo.CurrentTopic in addUserActivityPQDumpPostHookMethod');
  }
  if (!currentLearningObjective) {
    log('Not able to fetch CurrentTopicComponentInfo.CurrentLearningObjective in addUserActivityPQDumpPostHookMethod');
  }
  if (!currentTopicComponent) {
    log('Not able to fetch CurrentTopicComponentInfo.CurrentTopicComponentType in addUserActivityPQDumpPostHookMethod');
  }
  if (!topicId) {
    log('Not able to fetch LearningObjective.topic in addUserActivityPQDumpPostHookMethod');
  }
  if (!learningObjectiveInfo) {
    log('Not able to fetch LearningObjectiveInfo in addUserActivityPQDumpPostHookMethod');
  }
  const { id: currentTopicId } = currentTopic;
  const { id: currentLearningObjectiveId } = currentLearningObjective;
  if (!userLearningObjectiveId) {
    log('Not able to fetch LearningObjective.topic in addUserActivityPQDumpPostHookMethod');
  }
  // initializing fields for user PQ report
  let firstTryCount = 0;
  let secondTryCount = 0;
  let threeOrMoreTryCount = 0;
  let helpUsedCount = 0;
  let answerUsedCount = 0;
  let completedQuestionCount = 0;
  /*
  creating push many query which will be used while updating userLearningObjective
  it will contain all info about practice questions(isHintUsed, isAnswerUser, try count etc.)
  based on input sent by client in array of objects
  */
  const practiceQuestionsInUserLearningObjective = get(userLearningObjectiveInfo, 'practiceQuestions');
  if (!inputPracticeQuestions || !inputPracticeQuestions.length) {
    log('PracticeQuestions are not present in input in addUserActivityPQDumpPostHookMethod');
    throw new PracticeQuestionsNotPresentError();
  }
  if (!practiceQuestionsInUserLearningObjective ||
    !practiceQuestionsInUserLearningObjective.length) {
    log('PracticeQuestions are not present in UserLearningObjective in addUserActivityPQDumpPostHookMethod');
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'LearningObjective.PracticeQuestions: is not present',
      },
    });
  }
  const totalQuestions = practiceQuestionsInUserLearningObjective.length;
  let pushManyQuery = 'practiceQuestions:{ pushMany: [';
  /*
  We get practiceQuestions from UserLearningObjective and iterate on each one of them and
  update the same on the basis of question's status and whole PQ status and PQ from input.
  */
  practiceQuestionsInUserLearningObjective.forEach(
    (practiceQuestionInUserLearningObjective) => {
      // storing all the passed info in input in newPracticeQuestionInUserLearningObjective
      const { question,
        ...newPracticeQuestionInUserLearningObjective }
              = practiceQuestionInUserLearningObjective;
      const questionConnectId = get(practiceQuestionInUserLearningObjective, 'question.id');
      const { status: pqStatusInUserLearningObjective } =
              practiceQuestionInUserLearningObjective;
      pushManyQuery += `{ questionConnectId: "${questionConnectId}", `;
      /*
      Iterating over each practice question from input and will update question in
      userLearningobjective on basis of input(isCorrect, isHIntUsed, attemptNumber etc.)
      */
      inputPracticeQuestions.forEach((inputPracticeQuestion) => {
        const inputQuestionConnectId = get(inputPracticeQuestion, 'question.typeId');
        const {
          isCorrect,
          isHintUsed,
          isAnswerUsed,
          attemptNumber,
          questionAction,
        } = inputPracticeQuestion;
        /*
        As we are iterating over each question from userLearningObjective and input
        So, checking here for same question in both
        */
        if (questionConnectId === inputQuestionConnectId) {
          Object.assign(newPracticeQuestionInUserLearningObjective, { questionConnectId });
          /*
          Case: When individual question is incomplete and whole PQ is also incomplete.
          In that case user first attempt to correct the question is considered.
          Case example: user attempts and answers 2 PQ out of total 5 PQs and closes app.
          In this case when he comes back the status of 2 attempted question in already complete.
          Now, the status will not change for these 2 questions until the wholePQ is completed
          even he decide to re-answer them
          */
          if (practiceQuestionStatusBeforeUpdate === incomplete &&
                  pqStatusInUserLearningObjective === incomplete
          ) {
            if (isHintUsed === true) {
              Object.assign(newPracticeQuestionInUserLearningObjective, { isHintUsed });
            }
            if (isAnswerUsed === true) {
              Object.assign(newPracticeQuestionInUserLearningObjective, { isAnswerUsed });
            }
            if (questionAction === next && isCorrect === true) {
              const status = complete;
              Object.assign(newPracticeQuestionInUserLearningObjective, { status });
            }
            if (isCorrect === true && attemptNumber) {
              Object.assign(newPracticeQuestionInUserLearningObjective, { attemptNumber });
            }
            /*
            Case: when whole PQ is already completed and user is reattempting
            In this case the question user reattempts will get updated with new values
            rest of the questions will remain same if user skips them.
            */
          } else if (practiceQuestionStatus === complete &&
                  pqStatusInUserLearningObjective === complete) {
            Object.assign(newPracticeQuestionInUserLearningObjective, { isHintUsed });
            Object.assign(newPracticeQuestionInUserLearningObjective, { isAnswerUsed });
            if (isCorrect === true && attemptNumber) {
              Object.assign(newPracticeQuestionInUserLearningObjective, { attemptNumber });
            }
          }
        }
      });
      /*
      creating query which will be sent in UserLearningObjective on basis of ifno stored
      in newPracticeQuestionInUserLearningObjective
      */
      const {
        isHintUsed: updatedIsHintUsed,
        isAnswerUsed: updatedIsAnswerUsed,
        attemptNumber: updatedAttemptNumber,
        status: updatedStatus,
      } = newPracticeQuestionInUserLearningObjective;
      /*
      Storing count of all questions in completed state. We will use this in validating
      whether user current topic status should change. It will only change if all questions are
      in completed state and user hits next
      */
      if (updatedStatus === complete) {
        completedQuestionCount += 1;
      }
      // adding each upadated question in push many query
      pushManyQuery += `isHintUsed: ${updatedIsHintUsed}, 
                                               isAnswerUsed: ${updatedIsAnswerUsed}, 
                                               attemptNumber: ${updatedAttemptNumber}, 
                                               status: ${updatedStatus}, 
                                              }, `;

      /*
      These properties will be used in UserPracticeQuestionReport
      PQ report will only be generated when user hits next
      And a new PQ report will be created every time users hits next
      */
      if (pqAction === next) {
        if (updatedIsHintUsed) helpUsedCount += 1;
        if (updatedIsAnswerUsed) answerUsedCount += 1;
        if (updatedAttemptNumber === 1) {
          firstTryCount += 1;
        } else if (updatedAttemptNumber === 2) {
          secondTryCount += 1;
        } else {
          threeOrMoreTryCount += 1;
        }
      }
    });
  pushManyQuery += ']}';
  const popAllQuery = `practiceQuestions:{
                     popAll: true
                   }`;
  // practiceQuestionStatus will change to complete if user hits next
  if (pqAction && pqAction === next && completedQuestionCount === totalQuestions) {
    practiceQuestionStatus = complete;
  }
  // if existing practiceQuestionStatus is complete, it will remain complete
  if (userLearningObjectiveInfo &&
    practiceQuestionStatusBeforeUpdate === complete) {
    practiceQuestionStatus = complete;
  }
  /*
  We are checking whether user current topic status should be updated, below are the conditions:
  -user is hitting next and
  -all practice questions whould be in completed state
  -current topic component should be 'practiceQuestion'
  -called topic in input should be equal to current topic and
  -called learningObjective in input should be equal to current learningObjective
  Above conditions covers the case that current component status will only get changed, if
  called component is equal to current component and user has just consumed(next action) it
  and current component status will not get changed when it is already consumed in past
  */
  if (pqAction === next &&
    completedQuestionCount === totalQuestions &&
    currentTopicComponent === practiceQuestion &&
    currentTopicId === topicId &&
    currentLearningObjectiveId === learningObjectiveIdInResult
  ) {
    await callGraphqlApi(updateUserCurrentTopicComponentStatusMutation(
      currentTopicComponentId,
      nextCurrentTopicComponentType,
      restUserCurrentTopicComponentStatusQuery,
    ));
  }

  // popping all the practice questions and sending rest of the fields for update
  await callGraphqlApi(updateUserLearningObjectiveMutation(
    userLearningObjectiveId,
    isPracticeQuestionBookmarked,
    practiceQuestionStatus,
    popAllQuery,
  ));
  // pushing new array of objects(updated questions)
  await callGraphqlApi(updateUserLearningObjectiveMutationPracticeQuestions(
    userLearningObjectiveId,
    pushManyQuery,
  ));
  // PQ report will be generated every time when user hits next
  if (pqAction === next && completedQuestionCount === totalQuestions) {
    await callGraphqlApi(addUserPracticeQuestionReportMutation(
      userId,
      learningObjectiveIdInResult,
      firstTryCount,
      secondTryCount,
      threeOrMoreTryCount,
      helpUsedCount,
      answerUsedCount,
    ));
  }
  return true;
};

export default addUserActivityPQDumpPostHookMethod;

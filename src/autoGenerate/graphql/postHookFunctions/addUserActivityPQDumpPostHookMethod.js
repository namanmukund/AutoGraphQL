import { get } from 'lodash';
import callGraphqlApi from '../../../api/callGraphqlApi';
import {
  topicTypes,
  userActionType,
  userTopicTypeStatus,
} from '../../../../constants';
import { log } from '../../../../utils';

/* query to get userLO to check if document exists for userId and learningObjectiveId
also we are doing computation for chatStatus and next component for this */
const userLearningObjectiveQuery = async (userId, learningObjectiveId) => `
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
const updateUserCurrentTopicComponentStatusMutation = async (
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
const updateUserLearningObjectiveMutation = async (
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
const updateUserLearningObjectiveMutationPracticeQuestions = async (
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
const addUserPracticeQuestionReportMutation = async (
  userId,
  learningObjectivetId,
  firstTryCount,
  secondTryCount,
  threeOrMoreTryCount,
  helpUsedCount,
  answerUsedCount,
) => `
  mutation{
    addUserPracticeQuestionReport(
    userConnectId:"${userId}"
    learningObjectiveConnectId:"${learningObjectivetId}"
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
    await userLearningObjectiveQuery(userId, learningObjectiveId));
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
    practiceQuestions: inputPracticeQuestions,
  } = input;
  const isPracticeQuestionBookmarked = isBookmarkedFromInput || false;
  if (pqAction && pqAction === next) {
    practiceQuestionStatus = complete;
  }
  const {
    id: currentTopicComponentId,
    currentTopicComponentType: currentTopicComponent,
    currentLearningObjective,
    currentTopic,
  } = currentTopicComponentInfo;
  if (userLearningObjectiveInfo &&
      practiceQuestionStatusBeforeUpdate === complete) {
    practiceQuestionStatus = complete;
  }
  const nextComponentLearningObjectiveId = get(userLearningObjectiveInfo, 'nextComponent.learningObjective.id');
  const nextComponentType = get(userLearningObjectiveInfo, 'nextComponent.nextComponentType');
  let nextCurrentTopicComponentType;
  let restUserCurrentTopicComponentStatusQuery = '';
  // logic for checking the next component
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
  /*
  We are checking whether user current topic status should be updated, below are the conditions:
  -user is hitting next and
  -current topic component should be 'practiceQuestion'
  -called topic in input should be equal to current topic and
  -called learningObjective in input should be equal to current learningObjective
  Above conditions covers the case that current component status will only get changed, if
  called component is equal to current component and user has just consumed(next action) it
  and current component status will not get changed when it is already consumed in past
  */
  if (pqAction === next &&
      currentTopicComponent === practiceQuestion &&
      currentTopicId === topicId &&
      currentLearningObjectiveId === learningObjectiveIdInResult
  ) {
    await callGraphqlApi(await updateUserCurrentTopicComponentStatusMutation(
      currentTopicComponentId,
      nextCurrentTopicComponentType,
      restUserCurrentTopicComponentStatusQuery,
    ));
  }
  if (!userLearningObjectiveId) {
    log('Not able to fetch LearningObjective.topic in addUserActivityPQDumpPostHookMethod');
  }
  // initializing fields for user PQ report
  let firstTryCount = 0;
  let secondTryCount = 0;
  let threeOrMoreTryCount = 0;
  let helpUsedCount = 0;
  let answerUsedCount = 0;
  let pushManyQuery = 'practiceQuestions:{ pushMany: [';
  const practiceQuestionsInUserLearningObjective = get(userLearningObjectiveInfo, 'practiceQuestions');
  if (!inputPracticeQuestions || !inputPracticeQuestions.length) {
    log('PracticeQuestions are not present in input in addUserActivityPQDumpPostHookMethod');
  }
  if (!practiceQuestionsInUserLearningObjective ||
    !practiceQuestionsInUserLearningObjective.length) {
    log('PracticeQuestions are not present in UserLearningObjective in addUserActivityPQDumpPostHookMethod');
  }
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
      inputPracticeQuestions.forEach((inputPracticeQuestion) => {
        const inputQuestionConnectId = get(inputPracticeQuestion, 'question.typeId');
        const {
          isCorrect,
          isHintUsed,
          isAnswerUsed,
          attemptNumber,
          status,
        } = inputPracticeQuestion;
        if (questionConnectId === inputQuestionConnectId) {
          Object.assign(newPracticeQuestionInUserLearningObjective, { questionConnectId });
          // case when individual question is incomplete and
          // practice question is also incomplete
          if (practiceQuestionStatusBeforeUpdate === incomplete &&
                  pqStatusInUserLearningObjective === incomplete
          ) {
            if (isHintUsed === true) {
              Object.assign(newPracticeQuestionInUserLearningObjective, { isHintUsed });
            }
            if (isAnswerUsed === true) {
              Object.assign(newPracticeQuestionInUserLearningObjective, { isAnswerUsed });
            }
            if (status === userTopicTypeStatus.complete) {
              Object.assign(newPracticeQuestionInUserLearningObjective, { status });
            }
            if (isCorrect === true && attemptNumber) {
              Object.assign(newPracticeQuestionInUserLearningObjective, { attemptNumber });
            }
            // case when PQ is already completed and user is reattempting
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
      // creating query which will be sent in UserLearningObjective
      const {
        isHintUsed: updatedIsHintUsed,
        isAnswerUsed: updatedIsAnswerUsed,
        attemptNumber: updatedAttemptNumber,
        status: updatedStatus,
      } = newPracticeQuestionInUserLearningObjective;
      pushManyQuery += `isHintUsed: ${updatedIsHintUsed}, 
                                               isAnswerUsed: ${updatedIsAnswerUsed}, 
                                               attemptNumber: ${updatedAttemptNumber}, 
                                               status: ${updatedStatus}, 
                                              }, `;

      // these properties will be used in UserPracticeQuestionReport
      // PQ report will only be generated when user hits next
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
  let popAllQuery = '';
  // popping all the practice questions
  popAllQuery = `practiceQuestions:{
                     popAll: true
                   }`;

  await callGraphqlApi(await updateUserLearningObjectiveMutation(
    userLearningObjectiveId,
    isPracticeQuestionBookmarked,
    practiceQuestionStatus,
    popAllQuery,
  ));
  // pushing updated practice questions

  await callGraphqlApi(updateUserLearningObjectiveMutationPracticeQuestions(
    userLearningObjectiveId,
    pushManyQuery,
  ));
  // PQ report will only be generated when user hits next
  if (pqAction === next) {
    await callGraphqlApi(await addUserPracticeQuestionReportMutation(
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

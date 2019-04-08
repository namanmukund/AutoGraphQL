import { get } from 'lodash';
import callGraphqlApi from '../../../api/callGraphqlApi';
import {
  topicTypes,
  userActionType,
  userTopicTypeStatus,
} from '../../../../constants';
import { log } from '../../../../utils';
import {
  DatabaseRecordNotFoundError, PracticeQuestionsNotPresentError,
  UserOrLearningObjectiveNotPresentError,
} from '../../../../constants/errors';
import getUserCurrentTopicComponentStatus from '../../utils/getUserCurrentTopicComponentStatus';

// query to get learning objective and the topic associated
const learningObjectiveQuery = async learningObjectiveId => `
  query{
    learningObjective(id:"${learningObjectiveId}"){
      id
      topic{
        id
      }
    }
  }
  `;

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
const addUserActivityPQDumpPostHookMethod = async (input) => {
  const userId = get(input, 'user.typeId');
  const learningObjectiveId = get(input, 'learningObjective.typeId');
  if (!userId || !learningObjectiveId) {
    log('Either one of userId or learningObjectiveId is missing in input of addUserActivityPQDumpPostHookMethod');
    throw new UserOrLearningObjectiveNotPresentError();
  }
  const learningObjectiveQueryRes = await callGraphqlApi(
    await learningObjectiveQuery(learningObjectiveId));
  const learningObjectiveInfo = get(learningObjectiveQueryRes, 'data.learningObjective');
  const topicId = get(learningObjectiveInfo, 'topic.id');
  const {
    id: learningObjectiveIdInResult,
  } = learningObjectiveInfo;
  const currentTopicQuery = `currentTopic{
                                id 
                             }`;
  const currentLearningObjectiveQuery = `currentLearningObjective{
                                            id 
                                         }`;
  const userCurrentTopicComponentStatusRes =
    await getUserCurrentTopicComponentStatus(
      userId,
      currentTopicQuery,
      currentLearningObjectiveQuery,
      '',
    );
  const currentTopicComponentInfo = get(userCurrentTopicComponentStatusRes, 'data.userCurrentTopicComponentStatuses[0]');
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
    log('Not able to fetch currentTopic in addUserActivityPQDumpPostHookMethod');
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'CurrentTopicComponentInfo.CurrentTopic: is not present',
      },
    });
  }
  if (!currentLearningObjective) {
    log('Not able to fetch currentLearningObjective in addUserActivityPQDumpPostHookMethod');
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'CurrentTopicComponentInfo.CurrentLearningObjective: is not present',
      },
    });
  }
  if (!currentTopicComponent) {
    log('Not able to fetch currentTopicComponent in addUserActivityPQDumpPostHookMethod');
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'CurrentTopicComponentInfo.CurrentTopicComponentType: is not present',
      },
    });
  }
  if (!topicId) {
    log('Not able to fetch topicInfo in addUserActivityPQDumpPostHookMethod');
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'LearningObjective.topic: is not present',
      },
    });
  }
  if (!learningObjectiveInfo) {
    log('Not able to fetch topicInfo in addUserActivityPQDumpPostHookMethod');
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'LearningObjectiveInfo: is not present',
      },
    });
  }
  const { id: currentTopicId } = currentTopic;
  const { id: currentLearningObjectiveId } = currentLearningObjective;
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
    log('Not able to fetch userLearningObjectiveId in addUserActivityPQDumpPostHookMethod');
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'LearningObjective.topic: is not present',
      },
    });
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
    throw new PracticeQuestionsNotPresentError();
  }
  if (!practiceQuestionsInUserLearningObjective ||
    !practiceQuestionsInUserLearningObjective.length) {
    log('PracticeQuestions are not present in UserLearningObjective in addUserActivityPQDumpPostHookMethod');
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'UserLearningObjective.practiceQuestions: is not present',
      },
    });
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

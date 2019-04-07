import { get } from 'lodash';
import callGraphqlApi from '../../../api/callGraphqlApi';
import {
  topicTypes,
  GLOBAL_COURSE_ID,
  userActionType,
  userTopicTypeStatus, PUBLISHED,
} from '../../../../constants';
import {
  DatabaseRecordNotFoundError,
  UserOrLearningObjectiveNotPresentError,
} from '../../../../constants/errors';
import { log } from '../../../../utils';

// query to get learning objective and the topic associated with it
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

// query to get current topic component status so that we can change the next component accordingly
const userCurrentTopicComponentStatusQuery = async userId => `
  query{
    userCurrentTopicComponentStatuses(filter:{
      and:[
        {user_some:{
        id:"${userId}"
        }},
      {currentCourse_some:{
        and:[
          {status: ${PUBLISHED}},
          {id:"${GLOBAL_COURSE_ID}"}
        ]
      }}
      ]
    }){
      id
      currentTopic{
        id
      }
      currentLearningObjective{
        id
      }
      currentTopicComponentType
    }
  }
  `;

// query to get userLO to check if document exists for userId and learningObjectiveId
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
      chatStatus
    }
  }
  `;

// query to update user current topic component status
const updateUserCurrentTopicComponentStatusMutation = async (
  currentTopicComponentId,
  practiceQuestion,
) => `
  mutation{
    updateUserCurrentTopicComponentStatus(id:"${currentTopicComponentId}",  input:{
      currentTopicComponentType: ${practiceQuestion}
    }
    ){
      id
    }
  }
  `;

// query to update user LO based on activity done by user
const updateUserLearningObjectiveMutation = async (userLearningObjectiveId,
  isChatBookmarked,
  chatStatus,
) => `
  mutation{
    updateUserLearningObjective(id:"${userLearningObjectiveId}",  input:{
      isChatBookmarked: ${isChatBookmarked}
      chatStatus: ${chatStatus}
    }){
      id
      chatStatus
      isChatBookmarked
    }
  }
  `;

/*
Current topic component status and
UserLearningObjective(bookmark, chatStatus) is updated based on-
  -current topic component status
  -user Learning Objective for provided userId and learning objective id
  -learning objective and topic
*/
const addUserActivityChatDumpPostHookMethod = async (input) => {
  const userId = get(input, 'user.typeId');
  const learningObjectiveId = get(input, 'learningObjective.typeId');
  if (!userId || !learningObjectiveId) {
    log('Either one of userId or learningObjectiveId is missing in input of addUserActivityChatDumpPostHookMethod');
    throw new UserOrLearningObjectiveNotPresentError();
  }
  const learningObjectiveQueryRes =
    await callGraphqlApi(await learningObjectiveQuery(learningObjectiveId));
  const learningObjectiveInfo = get(learningObjectiveQueryRes, 'data.learningObjective');
  const topicId = get(learningObjectiveInfo, 'topic.id');
  const { id: learningObjectiveIdInResult } = learningObjectiveInfo;
  // query to get current component status of user
  const userCurrentTopicComponentStatusRes =
    await callGraphqlApi(await userCurrentTopicComponentStatusQuery(userId));
  const currentTopicComponentInfo = get(userCurrentTopicComponentStatusRes, 'data.userCurrentTopicComponentStatuses[0]');
  const userLearningObjectiveQueryRes =
    await callGraphqlApi(await userLearningObjectiveQuery(userId, learningObjectiveId));
  const userLearningObjectiveInfo = get(userLearningObjectiveQueryRes, 'data.userLearningObjectives[0]');
  const { id: userLearningObjectiveId,
    chatStatus: existingChatStatus } = userLearningObjectiveInfo;
  const { complete, incomplete } = userTopicTypeStatus;
  const { message, practiceQuestion } = topicTypes;
  const { next } = userActionType;
  let chatStatus = incomplete;
  const { chatAction, isChatBookmarked: isChatBookmarkedFromInput } = input;
  const isChatBookmarked = isChatBookmarkedFromInput || false;
  if (chatAction && chatAction === next) {
    chatStatus = complete;
  }
  const {
    id: currentTopicComponentId,
    currentTopicComponentType: currentTopicComponent,
    currentLearningObjective,
    currentTopic,
  } = currentTopicComponentInfo;
  if (!currentTopic) {
    log('Not able to fetch currentTopic in addUserActivityChatDumpPostHookMethod');
    throw new DatabaseRecordNotFoundError('CurrentTopicComponentInfo.CurrentTopic: ');
  }
  if (!currentLearningObjective) {
    log('Not able to fetch currentLearningObjective in addUserActivityChatDumpPostHookMethod');
    throw new DatabaseRecordNotFoundError('CurrentTopicComponentInfo.CurrentLearningObjective: ');
  }
  if (!currentTopicComponent) {
    log('Not able to fetch currentTopicComponent in addUserActivityChatDumpPostHookMethod');
    throw new DatabaseRecordNotFoundError('CurrentTopicComponentInfo.CurrentTopicComponentType: ');
  }
  if (!topicId) {
    log('Not able to fetch topicInfo in addUserActivityChatDumpPostHookMethod');
    throw new DatabaseRecordNotFoundError('LearningObjective.topic: ');
  }
  const { id: currentTopicId } = currentTopic;
  const { id: currentLearningObjectiveId } = currentLearningObjective;
  if (chatAction === next &&
      currentTopicComponent === message &&
      currentTopicId === topicId &&
      currentLearningObjectiveId === learningObjectiveIdInResult
  ) {
    await callGraphqlApi(await updateUserCurrentTopicComponentStatusMutation(
      currentTopicComponentId, practiceQuestion));
  }
  // if existing chatStatus is complete, it will remain complete
  if (userLearningObjectiveInfo &&
      existingChatStatus === complete) {
    chatStatus = complete;
  }

  if (!userLearningObjectiveId) {
    log('Not able to fetch userLearningObjectiveId in addUserActivityChatDumpPostHookMethod');
    throw new DatabaseRecordNotFoundError('LearningObjective.topic: ');
  }
  // update
  await callGraphqlApi(await updateUserLearningObjectiveMutation(
    userLearningObjectiveId,
    isChatBookmarked,
    chatStatus));
  return true;
};

export default addUserActivityChatDumpPostHookMethod;

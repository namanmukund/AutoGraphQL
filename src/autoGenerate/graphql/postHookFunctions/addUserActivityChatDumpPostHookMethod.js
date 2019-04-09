import { get } from 'lodash';
import callGraphqlApi from '../../../api/callGraphqlApi';
import {
  topicTypes,
  userActionType,
  userTopicTypeStatus,
} from '../../../../constants';
import { log } from '../../../../utils';

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
const addUserActivityChatDumpPostHookMethod = async (input, mutationName, context) => {
  const userId = get(input, 'user.typeId');
  const learningObjectiveId = get(input, 'learningObjective.typeId');
  if (!userId || !learningObjectiveId) {
    log('Either one of userId or learningObjectiveId is missing in input of addUserActivityChatDumpPostHookMethod');
  }
  const learningObjectiveInfo = get(context, `${mutationName}.learningObjective`);
  const topicId = get(learningObjectiveInfo, 'topic.id');
  const { id: learningObjectiveIdInResult } = learningObjectiveInfo;
  // getting data for user current topic component status from context based on mutationName
  const currentTopicComponentInfo = get(context, `${mutationName}.userCurrentTopicComponentStatuses`);
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
    log('Not able to fetch CurrentTopicComponentInfo.CurrentTopic in addUserActivityChatDumpPostHookMethod');
  }
  if (!currentLearningObjective) {
    log('Not able to fetch CurrentTopicComponentInfo.currentLearningObjective in addUserActivityChatDumpPostHookMethod');
  }
  if (!currentTopicComponent) {
    log('Not able to fetch CurrentTopicComponentInfo.CurrentTopicComponentType in addUserActivityChatDumpPostHookMethod');
  }
  if (!topicId) {
    log('Not able to fetch LearningObjective.topic in addUserActivityChatDumpPostHookMethod');
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
    log('Not able to fetch LearningObjective.topic in addUserActivityChatDumpPostHookMethod');
  }
  // update
  await callGraphqlApi(await updateUserLearningObjectiveMutation(
    userLearningObjectiveId,
    isChatBookmarked,
    chatStatus));
  return true;
};

export default addUserActivityChatDumpPostHookMethod;

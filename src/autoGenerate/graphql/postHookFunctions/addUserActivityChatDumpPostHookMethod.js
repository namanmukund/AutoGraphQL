import { get } from 'lodash';
import callGraphqlApi from '../../../api/callGraphqlApi';
import {
  userActionType,
  userTopicTypeStatus,
} from '../../../../constants';
import { log } from '../../../../utils';
import updateCurrentComponentStatus from './utils/updateCurrentComponentStatus';

// query to get userLO to check if document exists for userId and learningObjectiveId
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
      chatStatus
    }
  }
  `;

// query to update user LO based on activity done by user
const updateUserLearningObjectiveMutation = (userLearningObjectiveId,
  isChatBookmarked,
  chatStatus,
) => `
  mutation{
    updateUserLearningObjective(id:"${userLearningObjectiveId}",  input:{
      ${typeof isChatBookmarked === 'boolean' ? `isChatBookmarked: ${isChatBookmarked}` : ''}
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
  /*
  getting data for learningObjective from context based on mutationName
  this will be used to get parent topic id for the learning objective
  */
  const learningObjectiveInfo = get(context, `${mutationName}.learningObjective`);
  const topicId = get(learningObjectiveInfo, 'topic.id');
  const { id: learningObjectiveIdInResult } = learningObjectiveInfo;
  /*
  we are getting userLearningObjective for below purpose:
  -we get userLearningObjective id , which will be used further to update the document
  -we use chatStatus field to cover the scenario, if user is coming back to a completed chat
    in that case if he is hitting back after chat consumption, status will not get updated
    if it is already completed
  */
  const userLearningObjectiveQueryRes =
    await callGraphqlApi(userLearningObjectiveQuery(userId, learningObjectiveId));
  const userLearningObjectiveInfo = get(userLearningObjectiveQueryRes, 'data.userLearningObjectives[0]');
  const { id: userLearningObjectiveId,
    chatStatus: existingChatStatus } = userLearningObjectiveInfo;
  const { complete, incomplete } = userTopicTypeStatus;
  const { next } = userActionType;
  let chatStatus = incomplete;
  const { chatAction, isBookmarked: isChatBookmarked } = input;
  if (chatAction && chatAction === next) {
    chatStatus = complete;
  }
  /*
 Getting data for user current topic component status from context based on mutationName
 This will be used to cover the case that current component status will only get changed, if
 called component is equal to current component and user has just consumed(next action) it
 And current component status will not get changed when it is already consumed in past
 */
  const currentTopicComponentInfo = get(context, `${mutationName}.userCurrentTopicComponentStatuses`);
  /*
  Calling method to update current user Topic Component status
  */
  await updateCurrentComponentStatus(
    currentTopicComponentInfo,
    chatAction,
    topicId,
    learningObjectiveIdInResult,
    'message',
  );
  // if existing chatStatus is complete, it will remain complete
  if (userLearningObjectiveInfo &&
      existingChatStatus === complete) {
    chatStatus = complete;
  }

  if (!userLearningObjectiveId) {
    log('Not able to fetch LearningObjective.topic in addUserActivityChatDumpPostHookMethod');
  }
  /*
  updating user Learning Objective document on the basis of
  isChatBookmarked, user action(next, back etc) in input
  */
  await callGraphqlApi(updateUserLearningObjectiveMutation(
    userLearningObjectiveId,
    isChatBookmarked,
    chatStatus));
  return true;
};

export default addUserActivityChatDumpPostHookMethod;

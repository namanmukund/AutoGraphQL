import { get } from 'lodash';
import callGraphqlApi from '../../../api/callGraphqlApi';
import {
  topicTypes,
  GLOBAL_COURSE_ID,
  userActionType,
  userTopicTypeStatus,
} from '../../../../constants';

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
  if (userId && learningObjectiveId) {
    const learningObjectiveQueryRes =
    await callGraphqlApi(await learningObjectiveQuery(learningObjectiveId));
    const learningObjectiveInfo = get(learningObjectiveQueryRes, 'data.learningObjective');
    const topicInfo = get(learningObjectiveInfo, 'topic');
    const { id: topicId } = topicInfo;
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
    let isChatBookmarked = false;
    const { complete, incomplete } = userTopicTypeStatus;
    const { message, practiceQuestion } = topicTypes;
    const { next } = userActionType;
    let chatStatus = incomplete;
    const { chatAction } = input;
    isChatBookmarked = get(input, 'isBookmarked');
    if (chatAction && chatAction === next) {
      chatStatus = complete;
    }
    const {
      id: currentTopicComponentId,
      currentTopicComponentType: currentTopicComponent,
      currentLearningObjective,
      currentTopic,
    } = currentTopicComponentInfo;
    if (currentTopicComponent &&
      currentTopic &&
      topicInfo &&
      currentLearningObjective &&
      chatAction === next &&
      currentTopicComponent === message &&
      currentTopic.id === topicId &&
      currentLearningObjective.id === learningObjectiveIdInResult
    ) {
      await callGraphqlApi(await updateUserCurrentTopicComponentStatusMutation(
        currentTopicComponentId, practiceQuestion));
    }
    // if existing chatStatus is complete, it will remain complete
    if (userLearningObjectiveInfo &&
      existingChatStatus === complete) {
      chatStatus = complete;
    }

    if (userLearningObjectiveId) {
      // update
      await callGraphqlApi(await updateUserLearningObjectiveMutation(userLearningObjectiveId,
        isChatBookmarked,
        chatStatus));
    }
  }
};

export default addUserActivityChatDumpPostHookMethod;

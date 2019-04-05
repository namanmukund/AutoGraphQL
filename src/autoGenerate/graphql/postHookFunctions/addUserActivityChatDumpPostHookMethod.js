import { get } from 'lodash';
import callGraphqlApi from '../../../api/callGraphqlApi';
import {
  topicTypes,
  GLOBAL_COURSE_ID,
  userActionType,
  userTopicTypeStatus,
} from '../../../../constants';

const addUserActivityChatDumpPostHookMethod = async (input) => {
  const userId = get(input, 'user.typeId');
  const learningObjectiveId = get(input, 'learningObjective.typeId');
  if (userId && learningObjectiveId) {
    const learningObjectiveQuery = `
          query{
            learningObjective(id:"${learningObjectiveId}"){
              id
              order
              topic{
                id
                order
                isTrial
                learningObjectives{
                  id
                  order
                }
              }
              questionBank(filter:{assessmentType:${topicTypes.practiceQuestion}}){
                id
              }
            }
          }
          `;
    const learningObjectiveQueryRes = await callGraphqlApi(learningObjectiveQuery);
    const learningObjectiveInfo = get(learningObjectiveQueryRes, 'data.learningObjective');
    const topicInfo = get(learningObjectiveInfo, 'topic');
    const topicId = get(topicInfo, 'id');
    const learningObjectivetId = get(learningObjectiveInfo, 'id');
    const learningObjectiveOrder = get(learningObjectiveInfo, 'order');
    // query to get current component status of user
    const userCurrentTopicComponentStatusQuery = `
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
              currentLearningObjective{
                id
                order
              }
              currentTopicComponentType
              enrollmentType
            }
          }
          `;
    const userCurrentTopicComponentStatusRes =
      await callGraphqlApi(userCurrentTopicComponentStatusQuery);
    const currentTopicComponentInfo = get(userCurrentTopicComponentStatusRes, 'data.userCurrentTopicComponentStatuses[0]');
    const userLearningObjectiveQuery = `
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
              nextComponent{
                learningObjective{
                  id
                }
                nextComponentType
              }
            }
          }
          `;
    const userLearningObjectiveQueryRes = await callGraphqlApi(userLearningObjectiveQuery);
    const userLearningObjectiveInfo = get(userLearningObjectiveQueryRes, 'data.userLearningObjectives[0]');
    const userLearningObjectiveId = get(userLearningObjectiveInfo, 'id');
    let isChatBookmarked = false;
    let chatStatus = userTopicTypeStatus.incomplete;
    const chatAction = get(input, 'chatAction');
    isChatBookmarked = get(input, 'isBookmarked');
    if (chatAction && chatAction === userActionType.next) {
      chatStatus = userTopicTypeStatus.complete;
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
      chatAction === userActionType.next &&
      currentTopicComponent === topicTypes.message &&
      currentTopic.id === topicId &&
      currentLearningObjective.id === learningObjectiveInfo.id
    ) {
      const updateUserCurrentTopicComponentStatusMutation = `
              mutation{
                updateUserCurrentTopicComponentStatus(id:"${currentTopicComponentId}",  input:{
                  currentTopicComponentType: ${topicTypes.practiceQuestion}
                }
                ){
                  id
                }
              }
              `;
      await callGraphqlApi(updateUserCurrentTopicComponentStatusMutation);
    }
    if (userLearningObjectiveInfo &&
      userLearningObjectiveInfo.chatStatus === userTopicTypeStatus.complete) {
      chatStatus = userTopicTypeStatus.complete;
    }
    let restQuerv = '';
    const nextComponent = get(userLearningObjectiveInfo, 'nextComponent.learningObjective.id');
    const learningObjectives = get(topicInfo, 'learningObjectives');
    const nextLearningObjectiveOrder = parseInt(learningObjectiveOrder, 10) + 1;
    let nextLOId;
    let nextCurrentTopicComponentType;
    let learningObjectiveConnectIdQuerv = '';
    let topicConnectIdQuerv = '';
    learningObjectives.forEach((learningObjective) => {
      if (learningObjective &&
        learningObjective.order === nextLearningObjectiveOrder
      ) {
        nextLOId = learningObjective.id;
      }
    });
    // checking if next component is quiz or message
    if (nextLOId) {
      nextCurrentTopicComponentType = topicTypes.message;
      learningObjectiveConnectIdQuerv = `learningObjectiveConnectId:"${nextLOId}"`;
    } else {
      topicConnectIdQuerv = `topicConnectId:"${topicId}"`;
      nextCurrentTopicComponentType = topicTypes.quiz;
    }
    // restQuery is for when we ceate/update userLearningObjective
    if (learningObjectivetId && !nextComponent) {
      restQuerv = `nextComponent:{
                     ${learningObjectiveConnectIdQuerv}
                     ${topicConnectIdQuerv}
                     nextComponentType: ${nextCurrentTopicComponentType}
                   }`;
    }

    if (userLearningObjectiveId) {
      // update
      const updateUserLearningObjectiveMutation = `
          mutation{
            updateUserLearningObjective(id:"${userLearningObjectiveId}",  input:{
              isChatBookmarked: ${isChatBookmarked}
              chatStatus: ${chatStatus}
              ${restQuerv}
            }){
              id
              chatStatus
              isChatBookmarked
            }
          }
          `;

      await callGraphqlApi(updateUserLearningObjectiveMutation);
    }
  }
};

export default addUserActivityChatDumpPostHookMethod;

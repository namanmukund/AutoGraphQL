import { get } from 'lodash';
import callGraphqlApi from '../../../api/callGraphqlApi';
import {
  componentTypes,
  GLOBAL_COURSE_ID,
  userActionType,
  userComponentStatus,
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
              questionBank(filter:{assessmentType:${componentTypes.practiceQuestion}}){
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
              currentLearningObjective{
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
    const userLOQuery = `
          query{
            userLos(filter:{
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
    const userLOQueryRes = await callGraphqlApi(userLOQuery);
    const userLOInfo = get(userLOQueryRes, 'data.userLos[0]');
    const userLOId = get(userLOInfo, 'id');
    let isChatBookmarked = false;
    let chatStatus = userComponentStatus.incomplete;
    const chatAction = get(input, 'chatAction');
    isChatBookmarked = get(input, 'isBookmarked');
    if (chatAction && chatAction === userActionType.next) {
      chatStatus = userComponentStatus.complete;
    }
    const {
      id: currentComponentId,
      currentComponentType: currentComponent,
      currentLearningObjective,
      currentTopic,
    } = currentComponentInfo;
    if (currentComponent &&
      currentTopic &&
      topicInfo &&
      currentLearningObjective &&
      chatAction === userActionType.next &&
      currentComponent === componentTypes.message &&
      currentTopic.id === topicId &&
      currentLearningObjective.id === learningObjectiveInfo.id
    ) {
      const updateUserCurrentComponentStatusMutation = `
              mutation{
                updateUserCurrentComponentStatus(id:"${currentComponentId}",  input:{
                  currentComponentType: ${componentTypes.practiceQuestion}
                }
                ){
                  id
                }
              }
              `;
      await callGraphqlApi(updateUserCurrentComponentStatusMutation);
    }
    if (userLOInfo && userLOInfo.chatStatus === userComponentStatus.complete) {
      chatStatus = userComponentStatus.complete;
    }
    let restQuerv = '';
    const nextComponent = get(userLOInfo, 'nextComponent.learningObjective.id');
    const learningObjectives = get(topicInfo, 'learningObjectives');
    const nextLearningObjectiveOrder = parseInt(learningObjectiveOrder, 10) + 1;
    let nextLOId;
    let nextCurrentComponentType;
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
      nextCurrentComponentType = componentTypes.message;
      learningObjectiveConnectIdQuerv = `learningObjectiveConnectId:"${nextLOId}"`;
    } else {
      topicConnectIdQuerv = `topicConnectId:"${topicId}"`;
      nextCurrentComponentType = componentTypes.quiz;
    }
    // restQuery is for when we ceate/update userLO
    if (learningObjectivetId && !nextComponent) {
      restQuerv = `nextComponent:{
                     ${learningObjectiveConnectIdQuerv}
                     ${topicConnectIdQuerv}
                     nextComponentType: ${nextCurrentComponentType}
                   }`;
    }

    if (userLOId) {
      // update
      const updateUserLOMutation = `
          mutation{
            updateUserLO(id:"${userLOId}",  input:{
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

      await callGraphqlApi(updateUserLOMutation);
    }
  }
};

export default addUserActivityChatDumpPostHookMethod;

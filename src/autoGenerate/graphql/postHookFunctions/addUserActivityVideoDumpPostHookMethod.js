import { get } from 'lodash';
import callGraphqlApi from '../../../api/callGraphqlApi';
import {
  topicTypes,
  GLOBAL_COURSE_ID,
  userActionType,
  userTopicTypeStatus,
} from '../../../../constants';

const addUserActivityVideoDumpPostHookMethod = async (input) => {
  const userId = get(input, 'user.typeId');
  const topicId = get(input, 'topic.typeId');
  // query to get topic info
  if (userId && topicId) {
    const topicQuery = `
          query{
            topic(id:"${topicId}"){
              id
              order
              learningObjectives(filter:{
                order: 1
              }){
                id
              }
            }
          }
          `;
    const topicQueryRes = await callGraphqlApi(topicQuery);
    const topicInfo = get(topicQueryRes, 'data.topic');

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
              currentTopicComponentType
              enrollmentType
            }
          }
          `;
    const userCurrentTopicComponentStatusRes =
      await callGraphqlApi(userCurrentTopicComponentStatusQuery);
    const currentTopicComponentInfo = get(userCurrentTopicComponentStatusRes, 'data.userCurrentTopicComponentStatuses[0]');
    const userVideoQuery = `
          query{
            userVideos(filter:{
              and:[
                {user_some:{
                id:"${userId}"
                }},
              {topic_some:{
                id:"${topicId}"
              }}
              ]
            }){
              id
              status
              nextComponent{
                learningObjective{
                  id
                }
                nextComponentType
              }
            }
          }
          `;
    const userVideoQueryRes = await callGraphqlApi(userVideoQuery);
    const userVideoInfo = get(userVideoQueryRes, 'data.userVideos[0]');
    const userVideoId = get(userVideoInfo, 'id');
    let isBookmarked = false;
    let isLiked = false;
    let videoCurrentTime = 0;
    let status = userTopicTypeStatus.incomplete;
    let learningObjectiveConnectId;
    isBookmarked = get(input, 'isBookmarked');
    isLiked = get(input, 'isLiked');
    videoCurrentTime = get(input, 'videoCurrentTime');
    const videoAction = get(input, 'videoAction');
    if (videoAction && videoAction === userActionType.next) {
      status = userTopicTypeStatus.complete;
    }
    const {
      id: currentTopicComponentId,
      currentTopicComponentType: currentTopicComponent,
      currentTopic,
    } = currentTopicComponentInfo;
    if (currentTopicComponent &&
      currentTopic &&
      topicInfo &&
      videoAction === userActionType.next &&
      currentTopicComponent === topicTypes.video &&
      currentTopic.id === topicInfo.id
    ) {
      learningObjectiveConnectId = get(topicInfo, 'learningObjectives[0].id');
      if (learningObjectiveConnectId) {
        const updateUserCurrentTopicComponentStatusMutation = `
              mutation{
                updateUserCurrentTopicComponentStatus(id:"${currentTopicComponentId}",  input:{
                  currentTopicComponentType: ${topicTypes.message}
                },
                currentLearningObjectiveConnectId:"${learningObjectiveConnectId}"
                ){
                  id
                }
              }
              `;
        await callGraphqlApi(updateUserCurrentTopicComponentStatusMutation);
      }
    }
    if (userVideoInfo && userVideoInfo.status === userTopicTypeStatus.complete) {
      status = userTopicTypeStatus.complete;
    }
    let restQuerv = '';
    const nextComponent = get(userVideoInfo, 'nextComponent.learningObjective.id');
    // this condition is to check that next component is populated only once on next
    if (learningObjectiveConnectId &&
      !nextComponent) {
      restQuerv = `nextComponent:{
                     learningObjectiveConnectId:"${learningObjectiveConnectId}"
                     nextComponentType: ${topicTypes.message}
                   }`;
    }
    if (userVideoId) {
      // update
      const updateUserVideoMutation = `
          mutation{
            updateUserVideo(id:"${userVideoId}",  input:{
              videoCurrentTime: ${videoCurrentTime}
              isBookmarked: ${isBookmarked}
              isLiked: ${isLiked}
              status: ${status}
              ${restQuerv}
            }){
              id
              status
              isBookmarked
              isLiked
              videoCurrentTime
            }
          }
          `;

      await callGraphqlApi(updateUserVideoMutation);
    } else {
      // create
      const addUserVideoMutation = `
              mutation{
                  addUserVideo(
                  userConnectId:"${userId}"
                  topicConnectId:"${topicId}"
                  input:{
                      videoCurrentTime: ${videoCurrentTime}
                      isBookmarked: ${isBookmarked}
                      isLiked: ${isLiked}
                      status: ${status}
                      ${restQuerv}
                  }
              ){
                    id
                  }
              }
              `;

      await callGraphqlApi(addUserVideoMutation);
    }
  }
};

export default addUserActivityVideoDumpPostHookMethod;

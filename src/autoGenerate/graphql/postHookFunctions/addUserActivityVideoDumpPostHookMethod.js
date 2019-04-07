import { get } from 'lodash';
import callGraphqlApi from '../../../api/callGraphqlApi';
import {
  topicTypes,
  GLOBAL_COURSE_ID,
  userActionType,
  userTopicTypeStatus, PUBLISHED,
} from '../../../../constants';
import { log } from '../../../../utils';
import {
  DatabaseRecordNotFoundError,
  UserOrTopicNotPresentError,
} from '../../../../constants/errors';

/*
query to get topic and it's first lo to get populated in nextComponent of UserVideo
we also use order of topic to check if current topic component should be updated
*/
const topicQuery = async topicId => `
  query{
    topic(id:"${topicId}"){
      id
    }
  }
  `;

// query to get current component status of user
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

/*
query to get User video for given user and topic id
we use status and next component to update thses based on value fetched
*/
const userVideoQuery = async (userId, topicId) => `
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
    }
  }
  `;

// query to update user current topic component status
const updateUserCurrentTopicComponentStatusMutation = async currentTopicComponentId => `
  mutation{
    updateUserCurrentTopicComponentStatus(id:"${currentTopicComponentId}",  input:{
      currentTopicComponentType: ${topicTypes.message}
    }
    ){
      id
    }
  }
  `;

// mutation to update User Video
const updateUserVideoMutation = async (userVideoId,
  videoCurrentTime,
  isBookmarked,
  isLiked,
  status,
  restQuery) => `
  mutation{
    updateUserVideo(id:"${userVideoId}",  input:{
      videoCurrentTime: ${videoCurrentTime}
      isBookmarked: ${isBookmarked}
      isLiked: ${isLiked}
      status: ${status}
      ${restQuery}
    }){
      id
      status
      isBookmarked
      isLiked
      videoCurrentTime
    }
  }
  `;

/*
Current topic component status and
UserVideo(bookmark, status etc) is updated based on-
  -current topic component status
  -user Video for provided userId and topic id
  -learning objective whose order is 1
*/
const addUserActivityVideoDumpPostHookMethod = async (input) => {
  const userId = get(input, 'user.typeId');
  const topicId = get(input, 'topic.typeId');
  // query to get topic info
  if (!userId || !topicId) {
    log('Either one of userId or topicId is missing in input of addUserActivityVideoDumpPostHookMethod');
    throw new UserOrTopicNotPresentError();
  }
  const topicQueryRes = await callGraphqlApi(await topicQuery(topicId));
  const topicInfo = get(topicQueryRes, 'data.topic');
  const userCurrentTopicComponentStatusRes =
      await callGraphqlApi(await userCurrentTopicComponentStatusQuery(userId));
  const currentTopicComponentInfo = get(userCurrentTopicComponentStatusRes, 'data.userCurrentTopicComponentStatuses[0]');
  const userVideoQueryRes = await callGraphqlApi(await userVideoQuery(userId, topicId));
  const userVideoInfo = get(userVideoQueryRes, 'data.userVideos[0]');
  const {
    id: userVideoId,
    status: userVideoInfoStatus,
  } = userVideoInfo;
  const { complete, incomplete } = userTopicTypeStatus;
  const { next } = userActionType;
  const { video } = topicTypes;
  let status = incomplete;
  const {
    isBookmarked: isBookmarkedFromInput,
    isLiked: isLikedFromInput,
    videoCurrentTime: videoCurrentTimeFromInput,
    videoAction,
  } = input;
  const isBookmarked = isBookmarkedFromInput || false;
  const isLiked = isLikedFromInput || false;
  const videoCurrentTime = videoCurrentTimeFromInput || 0;
  if (videoAction && videoAction === next) {
    status = complete;
  }
  const {
    id: currentTopicComponentId,
    currentTopicComponentType: currentTopicComponent,
    currentTopic,
  } = currentTopicComponentInfo;
  if (!currentTopic) {
    log('Not able to fetch currentTopic in addUserActivityVideoDumpPostHookMethod');
    throw new DatabaseRecordNotFoundError('CurrentTopicComponentInfo.CurrentTopic: ');
  }
  if (!currentTopicComponent) {
    log('Not able to fetch currentTopicComponent in addUserActivityVideoDumpPostHookMethod');
    throw new DatabaseRecordNotFoundError('CurrentTopicComponentInfo.CurrentTopicComponentType: ');
  }
  if (!topicInfo) {
    log('Not able to fetch topicInfo in addUserActivityVideoDumpPostHookMethod');
    throw new DatabaseRecordNotFoundError('TopicInfo: ');
  }
  if (videoAction === next &&
      currentTopicComponent === video &&
      currentTopic.id === topicInfo.id
  ) {
    await callGraphqlApi(await updateUserCurrentTopicComponentStatusMutation(
      currentTopicComponentId,
    ));
  }
  if (userVideoInfo && userVideoInfoStatus === complete) {
    status = complete;
  }
  if (!userVideoId) {
    log('Not able to fetch UserVideoId in addUserActivityVideoDumpPostHookMethod');
    throw new DatabaseRecordNotFoundError('UserVideoId: ');
  }
  // update
  await callGraphqlApi(await updateUserVideoMutation(userVideoId,
    videoCurrentTime,
    isBookmarked,
    isLiked,
    status));
  return true;
};

export default addUserActivityVideoDumpPostHookMethod;

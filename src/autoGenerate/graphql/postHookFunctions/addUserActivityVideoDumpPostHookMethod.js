import { get } from 'lodash';
import callGraphqlApi from '../../../api/callGraphqlApi';
import {
  userActionType,
  userTopicTypeStatus,
} from '../../../../constants';
import { log } from '../../../../utils';
import updateCurrentComponentStatus from './utils/updateCurrentComponentStatus';

/*
query to get User video for given user and topic id
we use status and next component to update thses based on value fetched
*/
const userVideoQuery = (userId, topicId) => `
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

// mutation to update User Video
const updateUserVideoMutation = (userVideoId,
  videoCurrentTime,
  isBookmarked,
  isLiked,
  status) => `
  mutation{
    updateUserVideo(id:"${userVideoId}",  input:{
      videoCurrentTime: ${videoCurrentTime}
      isBookmarked: ${isBookmarked}
      isLiked: ${isLiked}
      status: ${status}
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
const addUserActivityVideoDumpPostHookMethod = async (input, mutationName, context) => {
  const userId = get(input, 'user.typeId');
  const topicId = get(input, 'topic.typeId');
  // query to get topic info
  if (!userId || !topicId) {
    log('Either one of userId or topicId is missing in input of addUserActivityVideoDumpPostHookMethod');
  }
  /*
  Getting data for user current topic component status from context based on mutationName
  This will be used to cover the case that current component status will only get changed, if
  called component is equal to current component and user has just consumed(next action) it
  And current component status will not get changed when it is already consumed in past
  */
  const currentTopicComponentInfo = get(context, `${mutationName}.userCurrentTopicComponentStatuses`);
  /*
  we are getting userVideo for below purpose:
  -we get userVideo id , which will be used further to update the document
  -we use status field to cover the scenario, if user is coming back to a completed video
  in that case if he is hitting back after video consumption, status will not get updated
  if it is already completed
  */
  const userVideoQueryRes = await callGraphqlApi(userVideoQuery(userId, topicId));
  const userVideoInfo = get(userVideoQueryRes, 'data.userVideos[0]');
  const {
    id: userVideoId,
    status: userVideoInfoStatus,
  } = userVideoInfo;
  const { complete, incomplete } = userTopicTypeStatus;
  const { next } = userActionType;
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
  /*
  Calling method to update current user Topic Component status
  */
  await updateCurrentComponentStatus(
    currentTopicComponentInfo,
    videoAction,
    topicId,
    '',
    'video',
  );
  // if existing status for video is complete, it will remain complete
  if (userVideoInfo && userVideoInfoStatus === complete) {
    status = complete;
  }
  if (!userVideoId) {
    log('Not able to fetch UserVideoId in addUserActivityVideoDumpPostHookMethod');
  }
  /*
  updating userVideo document on the basis of
  isBookmarked, user action(next, back etc) in input
  */
  await callGraphqlApi(updateUserVideoMutation(userVideoId,
    videoCurrentTime,
    isBookmarked,
    isLiked,
    status));
  return true;
};

export default addUserActivityVideoDumpPostHookMethod;

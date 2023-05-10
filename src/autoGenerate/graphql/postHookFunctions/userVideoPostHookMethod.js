import { get } from 'lodash';
import {
  PUBLISHED, topicTypes,
  userTopicTypeStatus,
} from '../../../../constants';
import getInfoFromParams from './utils/getInfoFromParams';
import parseTopicComponentResultData from './utils/parseTopicComponentResultData';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import deleteCreatedDocs from './utils/deleteCreatedDocs';
import { checkIfRoleCmsAdmin } from '../../../../utils/ifAuthorized';

// query to get topic and it's Lo with order 1
const topicQuery = (topicId) => `
  query{
    topic(id:"${topicId}"){
      id
      order
      topicComponentRule{
        componentName
        order
        learningObjectiveComponentsRule {
          componentName
          order
        }
        video{
          id
        }
      }
      learningObjectives(filter:{
        status: ${PUBLISHED}
        }
        orderBy: order_ASC
      ){
        id
        order
      }
    }
  }
  `;

// query to add UserVideo if it is not already present for user and topic id
const addUserVideoMutation = (
  userId,
  topicId,
  courseId,
  videoId,
) => `
  mutation{
    addUserVideo(
    userConnectId:"${userId}"
    topicConnectId:"${topicId}"
    ${courseId ? `courseConnectId:"${courseId}"` : ''}
    ${videoId ? `videoConnectId:"${videoId}"` : ''}
    input:{
      status: ${userTopicTypeStatus.incomplete}
    }
    ){
      id
      user{
        id
      }
      topic{
        id
      }
      videoCurrentTime
      isBookmarked
      isLiked
      status
    }
    }
    `;

/*
If userVideo document does not exist for provided combination of user id and topic id.
It will be created and returned to tekie app.
Document contains all the necessary information needed on page along
with the next component.
*/
const userVideoPostHookMethod = async (input, params, mutationName, context) => {
  /*
  checking if document is already present in collection for user and topic id,
  returning input in that case
  if it is not already present, we will add a new document with default data
  */
  const isRoleCmsAdmin = checkIfRoleCmsAdmin(context);
  if (isRoleCmsAdmin && input && input.length) {
    await deleteCreatedDocs(mutationName, input, context);
  }
  if (input && input.length && !isRoleCmsAdmin) {
    return input;
  }
  const resultArray = [];
  const {
    userId,
    topicId,
    courseId,
    videoId,
  } = getInfoFromParams(params, 'video');
  let finalVideoId = videoId;

  // In case there is no topic id, empty data will be sent
  if (!topicId) {
    return resultArray;
  }
  /*
    we are getting below fields in topicQuery:
    -first published learning objective of the query to be populated in next component
    */
  if (!finalVideoId) {
    const topicQueryRes = await callLocalGraphqlApi(topicQuery(topicId), context);
    const topicInfo = get(topicQueryRes, 'data.topic');
    const topicComponentRule = get(topicInfo, 'topicComponentRule');
    if (topicComponentRule && topicComponentRule.length > 0) {
      const {
        video,
      } = topicTypes;
      const sortedTopicComponentRule = topicComponentRule.sort((firstItem, secondItem) => firstItem.order - secondItem.order);
      sortedTopicComponentRule.forEach((topicComponent) => {
        if (topicComponent.componentName === video && !finalVideoId) {
          finalVideoId = topicComponent.video && topicComponent.video.id;
        }
      });
    }
  }

  const result = await callLocalGraphqlApi(addUserVideoMutation(
    userId,
    topicId,
    courseId,
    finalVideoId,
  ), context);
  if (result) {
    /*
      parsing data 'addUserVideo' so that the logic implemented ahead can read data is
      desired format and return the same.
      Example: suppose client has asked for title and order of topic,
      In that case he will get title and order only. And this is happening when we parse
      data as below. If parsing is not done, it is returning empty data.
      */
    const addUserVideoResult = get(result, 'data.addUserVideo');
    if (addUserVideoResult) {
      resultArray.push(parseTopicComponentResultData(addUserVideoResult, 'video'));
    }
  }
  return resultArray;
};

export default userVideoPostHookMethod;

import { get } from 'lodash';
import {
  OLD_COURSE_ID,
  PUBLISHED,
  userTopicTypeStatus,
} from '../../../../constants';
import getInfoFromParams from './utils/getInfoFromParams';
import getNextComponent from './utils/getNextComponent';
import parseTopicComponentResultData from './utils/parseTopicComponentResultData';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';

// query to get topic and it's Lo with order 1
const topicQuery = (topicId) => `
  query{
    topic(id:"${topicId}"){
      id
      order
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
  restQuery,
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
        ${restQuery}
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
      nextComponent{
        learningObjective{
          id
        }
        nextComponentType
      }
    }
    }
    `;

/*
If userVideo document does not exist for provided combination of user id and topic id.
It will be created and returned to tekie app.
Document contains all the necessary information needed on page along
with the next component.
*/
const userVideoPostHookMethod = async (input, params) => {
  /*
  checking if document is already present in collection for user and topic id,
  returning input in that case
  if it is not already present, we will add a new document with default data
  */
  let restQuery = '';
  if (input && input.length) {
    return input;
  }
  const resultArray = [];
  const {
    userId,
    topicId,
    courseId,
    videoId,
  } = getInfoFromParams(params, 'video');
  // In case there is no topic id, empty data will be sent
  if (!topicId) {
    return resultArray;
  }
  /*
    we are getting below fields in topicQuery:
    -first published learning objective of the query to be populated in next component
    */
  const topicQueryRes = await callLocalGraphqlApi(topicQuery(topicId));
  const topicInfo = get(topicQueryRes, 'data.topic');
  const learningObjectiveConnectId = get(topicInfo, 'learningObjectives[0].id');

  // next component will be chat of first published LO
  if (!courseId || (courseId === OLD_COURSE_ID)) {
    restQuery = getNextComponent(
      learningObjectiveConnectId,
      '',
      'video',
    );
  }
  /*
    adding addUserVideo document on the basis of
    restQuery(next component data), rest data will take default values from schema
    */
  const result = await callLocalGraphqlApi(addUserVideoMutation(
    userId,
    topicId,
    restQuery,
    courseId,
    videoId,
  ));
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

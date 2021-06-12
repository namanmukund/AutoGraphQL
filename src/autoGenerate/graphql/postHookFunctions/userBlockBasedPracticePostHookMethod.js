import { get } from 'lodash';
import {
  userTopicTypeStatus,
} from '../../../../constants';
import getInfoFromParams from './utils/getInfoFromParams';
import parseTopicComponentResultData from './utils/parseTopicComponentResultData';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';

// query to add UserBlockBasedPractice if it is not already present for user, blockBasedProjectId and topic id
const addUserBlockBasedPracticeMutation = (
  userId,
  topicId,
  courseId,
  blockBasedPracticeId,
) => `
  mutation{
    addUserBlockBasedPractice(
    userConnectId:"${userId}"
    topicConnectId:"${topicId}"
    ${courseId ? `courseConnectId:"${courseId}"` : ''}
    ${blockBasedPracticeId ? `blockBasedPracticeConnectId:"${blockBasedPracticeId}"` : ''}
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
      blockBasedPractice{
        id
      }
      answerLink
    }
    }
    `;

/*
If userBlockBasedPractice document does not exist for provided combination of user id, topic id & blockBasedProjectId.
It will be created and returned to tekie app.
Document contains all the necessary information needed on page along
with the next component.
*/
const userBlockBasedPracticePostHookMethod = async (input, params) => {
  /*
  checking if document is already present in collection for user and topic id,
  returning input in that case
  if it is not already present, we will add a new document with default data
  */
  if (input && input.length) {
    return input;
  }
  const resultArray = [];
  const {
    userId,
    topicId,
    courseId,
    blockBasedPracticeId,
  } = getInfoFromParams(params, 'blockBasedPractice');
  // In case there is no topic id, empty data will be sent
  if (!topicId) {
    return resultArray;
  }

  /*
    adding UserBlockBasedPractice document
    */
  const result = await callLocalGraphqlApi(addUserBlockBasedPracticeMutation(
    userId,
    topicId,
    courseId,
    blockBasedPracticeId,
  ));
  if (result) {
    /*
      parsing data 'addUserBlockBasedPractice' so that the logic implemented ahead can read data is
      desired format and return the same.
      Example: suppose client has asked for title and order of topic,
      In that case he will get title and order only. And this is happening when we parse
      data as below. If parsing is not done, it is returning empty data.
      */
    const addUserBlockBasedPracticeResult = get(result, 'data.addUserBlockBasedPractice');
    if (addUserBlockBasedPracticeResult) {
      resultArray.push(parseTopicComponentResultData(addUserBlockBasedPracticeResult, 'blockBasedPractice'));
    }
  }
  return resultArray;
};

export default userBlockBasedPracticePostHookMethod;

import { get } from 'lodash';
import {
  userTopicTypeStatus,
} from '../../../../constants';
import getInfoFromParams from './utils/getInfoFromParams';
import parseTopicComponentResultData from './utils/parseTopicComponentResultData';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';

// query to add UserBlockBasedProject if it is not already present for user, blockBasedProjectId and topic id
const addUserBlockBasedProjectMutation = (
  userId,
  topicId,
  courseId,
  blockBasedProjectId,
) => `
  mutation{
    addUserBlockBasedProject(
    userConnectId:"${userId}"
    topicConnectId:"${topicId}"
    ${courseId ? `courseConnectId:"${courseId}"` : ''}
    ${blockBasedProjectId ? `blockBasedProjectConnectId:"${blockBasedProjectId}"` : ''}
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
      blockBasedProject{
        id
      }
    }
    }
    `;

/*
If userBlockBasedProject document does not exist for provided combination of user id, topic id & blockBasedProjectId.
It will be created and returned to tekie app.
Document contains all the necessary information needed on page along
with the next component.
*/
const userBlockBasedProjectPostHookMethod = async (input, params) => {
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
    blockBasedProjectId,
  } = getInfoFromParams(params, 'blockBasedProject');
  // In case there is no topic id, empty data will be sent
  if (!topicId) {
    return resultArray;
  }

  /*
    adding UserBlockBasedProject document
    */
  const result = await callLocalGraphqlApi(addUserBlockBasedProjectMutation(
    userId,
    topicId,
    courseId,
    blockBasedProjectId,
  ));
  if (result) {
    /*
      parsing data 'addUserBlockBasedProject so that the logic implemented ahead can read data is
      desired format and return the same.
      Example: suppose client has asked for title and order of topic,
      In that case he will get title and order only. And this is happening when we parse
      data as below. If parsing is not done, it is returning empty data.
      */
    const addUserBlockBasedProjectResult = get(result, 'data.addUserBlockBasedProject');
    if (addUserBlockBasedProjectResult) {
      resultArray.push(parseTopicComponentResultData(addUserBlockBasedProjectResult, 'blockBasedProject'));
    }
  }
  return resultArray;
};

export default userBlockBasedProjectPostHookMethod;

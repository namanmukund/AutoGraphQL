import { get } from 'lodash';
import {
  userTopicTypeStatus,
} from '../../../../constants';
import getInfoFromParams from './utils/getInfoFromParams';
import parseTopicComponentResultData from './utils/parseTopicComponentResultData';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import { MENTEE } from '../../../../constants/roles';

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
      attachments {
        id
        uri
      }
      savedBlocks
    }
  }
`;

/*
If userBlockBasedPractice document does not exist for provided combination of user id, topic id & blockBasedProjectId.
It will be created and returned to tekie app.
Document contains all the necessary information needed on page along
with the next component.
*/
const userBlockBasedPracticePostHookMethod = async (input, params, context) => {
  /* eslint-disable prefer-const */
  let {
    userId,
    topicId,
    courseId,
    blockBasedPracticeId,
    blockBasedPracticeIds,
  } = getInfoFromParams(params, 'blockBasedPractice');

  const resultArray = [];

  // In case there is no topic id or blockBasedPracticeId/blockBasedPracticeIds,
  // empty data will be sent
  if ((!topicId || !(blockBasedPracticeId || blockBasedPracticeIds.length > 0))) {
    return resultArray;
  }

  if (blockBasedPracticeId) {
    blockBasedPracticeIds = [blockBasedPracticeId];
  }

  let blockBasedPracticeNotCreated = [];

  /*
    checking if document is already present in collection for user and topic id,
    returning input in that case
    if it is not already present, we will add a new document with default data
  */
  if ((input && input.length) || (typeof input === 'object' && get(input, 'id'))) {
    const inputArray = Array.isArray(input) ? input : [input];
    const userBlockBasedPracticeIdsInInput = inputArray.map((item) => get(item, 'blockBasedPractice.id'));
    blockBasedPracticeNotCreated = blockBasedPracticeIds.filter((blockBasedPracticeIdInParam) => !userBlockBasedPracticeIdsInInput.includes(blockBasedPracticeIdInParam));
    if (blockBasedPracticeNotCreated.length === 0) {
      return input;
    }
  }

  if (get(context, 'userRoleFromContext') && get(context, 'userRoleFromContext') !== MENTEE) {
    return input;
  }

  /* eslint-disable no-restricted-syntax */
  /* eslint-disable no-await-in-loop */
  for (const practiceId of blockBasedPracticeNotCreated) {
    /*
      adding UserBlockBasedPractice document
    */
    const result = await callLocalGraphqlApi(addUserBlockBasedPracticeMutation(
      userId,
      topicId,
      courseId,
      practiceId,
    ), context);
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
  }

  return resultArray;
};

export default userBlockBasedPracticePostHookMethod;

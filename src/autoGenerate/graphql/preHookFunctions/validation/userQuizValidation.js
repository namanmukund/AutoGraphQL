import { get } from 'lodash';
import {
  UserMismatchError,
  UserOrTopicNotPresentError,
} from '../../../../../constants/errors';
import isComponentUnlocked from './utils/isComponentUnlocked';
import getInfoFromContext from './utils/getInfoFromContext';

// prehook logic to check if requested UserQuiz(user and topic id) is unlocked
const userQuizValidation = async (params, context) => {
  // check if the called user and topic is unlocked
  /*
  Calling method to validate token and retun userId and isRequestFromBackend
  we will compare this userId against userId passed in input
  both should be equal to perform action
  */
  const contextInfo = getInfoFromContext(context);
  const {
    userIdFromContext,
    isRequestFromBackend,
  } = contextInfo;
  const filterArray = get(params, 'filter.and');
  if (!filterArray) {
    throw new UserOrTopicNotPresentError();
  }
  const userSome = filterArray.find(obj => obj.user_some);
  const topicSome = filterArray.find(obj => obj.topic_some);
  const userId = get(userSome, 'user_some.id');
  const topicId = get(topicSome, 'topic_some.id');
  if (!userId || !topicId) {
    throw new UserOrTopicNotPresentError();
  }
  if (!isRequestFromBackend && userIdFromContext !== userId) {
    throw new UserMismatchError();
  }
  await isComponentUnlocked(
    userId,
    '',
    topicId,
    '',
    '',
    'quiz',
  );
  return true;
};

export default userQuizValidation;

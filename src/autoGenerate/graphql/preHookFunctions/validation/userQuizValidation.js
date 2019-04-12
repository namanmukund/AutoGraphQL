import { get } from 'lodash';
import {
  UserOrTopicNotPresentError,
} from '../../../../../constants/errors';
import isComponentUnlocked from './utils/isComponentUnlocked';

// prehook logic to check if requested UserQuiz(user and topic id) is unlocked
const userQuizValidation = async (params) => {
  // check if the called user and topic is unlocked
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

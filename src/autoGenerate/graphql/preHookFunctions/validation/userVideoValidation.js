import { get } from 'lodash';
import {
} from '../../../../../constants';
import {
  UserOrTopicNotPresentError,
} from '../../../../../constants/errors';
import isComponentUnlocked from './utils/isComponentUnlocked';

// prehook logic to check if requested UserVideo(user and topic id) is unlocked
const userVideoValidation = async (params) => {
  // userVideo collection is used to store and get video page info
  // checking if called topic and user combination in accessible
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
    'video',
  );
  return true;
};

export default userVideoValidation;

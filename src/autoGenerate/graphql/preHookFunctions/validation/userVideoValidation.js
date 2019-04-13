import { get } from 'lodash';
import { backendApps } from '../../../../../constants';
import {
  UserMismatchError,
  UserOrTopicNotPresentError,
} from '../../../../../constants/errors';
import isComponentUnlocked from './utils/isComponentUnlocked';
import getUserIdandAppNameAfterValidation from './utils/getUserIdandAppNameAfterValidation';

// prehook logic to check if requested UserVideo(user and topic id) is unlocked
const userVideoValidation = async (params, context) => {
  // userVideo collection is used to store and get video page info
  // checking if called topic and user combination in accessible
  /*
  Calling method to validate token and return userId and appName
  we will compare this userId against userId passed in input
  both should be equal to perform further action
  */
  const userAndAppInfo = getUserIdandAppNameAfterValidation(context);
  const {
    userIdFromContext,
    appName,
  } = userAndAppInfo;
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
  if (!backendApps.includes(appName) && userIdFromContext !== userId) {
    throw new UserMismatchError();
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

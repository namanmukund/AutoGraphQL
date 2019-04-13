import { get } from 'lodash';
import {
  UserMismatchError,
  UserOrLearningObjectiveNotPresentError,
} from '../../../../../constants/errors';
import isComponentUnlocked from './utils/isComponentUnlocked';
import getUserIdandAppNameAfterValidation from './utils/getUserIdandAppNameAfterValidation';
import { backendApps } from '../../../../../constants';

// prehook logic to check if requested UserLO(user and LO id) is unlocked
const userLearningObjectiveValidation = async (params, context) => {
  // userLearningObjective collection is used to store and get chat and pq page info
  // checking if called lo and user combination is accessible
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
    throw new UserOrLearningObjectiveNotPresentError();
  }
  const userSome = filterArray.find(obj => obj.user_some);
  const loSome = filterArray.find(obj => obj.learningObjective_some);
  const userId = get(userSome, 'user_some.id');
  const learningObjectiveId = get(loSome, 'learningObjective_some.id');
  if (!userId || !learningObjectiveId) {
    throw new UserOrLearningObjectiveNotPresentError();
  }
  if (!backendApps.includes(appName) && userIdFromContext !== userId) {
    throw new UserMismatchError();
  }
  await isComponentUnlocked(
    userId,
    learningObjectiveId,
    '',
    '',
    '',
    'chat',
  );
  return true;
};

export default userLearningObjectiveValidation;

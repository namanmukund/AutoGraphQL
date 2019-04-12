import { get } from 'lodash';
import {
  UserMismatchError,
  UserOrLearningObjectiveNotPresentError,
} from '../../../../../constants/errors';
import isComponentUnlocked from './utils/isComponentUnlocked';
import getInfoFromContext from './utils/getInfoFromContext';

// prehook logic to check if requested UserLO(user and LO id) is unlocked
const userLearningObjectiveValidation = async (params, context) => {
  // userLearningObjective collection is used to store and get chat and pq page info
  // checking if called lo and user combination is accessible
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
    throw new UserOrLearningObjectiveNotPresentError();
  }
  const userSome = filterArray.find(obj => obj.user_some);
  const loSome = filterArray.find(obj => obj.learningObjective_some);
  const userId = get(userSome, 'user_some.id');
  const learningObjectiveId = get(loSome, 'learningObjective_some.id');
  if (!userId || !learningObjectiveId) {
    throw new UserOrLearningObjectiveNotPresentError();
  }
  if (!isRequestFromBackend && userIdFromContext !== userId) {
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

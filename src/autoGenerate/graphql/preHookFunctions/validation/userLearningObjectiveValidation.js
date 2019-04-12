import { get } from 'lodash';
import {
  UserOrLearningObjectiveNotPresentError,
} from '../../../../../constants/errors';
import isComponentUnlocked from './utils/isComponentUnlocked';

// prehook logic to check if requested UserLO(user and LO id) is unlocked
const userLearningObjectiveValidation = async (params) => {
  // userLearningObjective collection is used to store and get chat and pq page info
  // checking if called lo and user combination is accessible
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

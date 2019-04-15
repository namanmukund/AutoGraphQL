import isComponentUnlocked from './utils/isComponentUnlocked';
import { topicTypes } from '../../../../../constants';

// prehook logic to check if requested UserLO(user and LO id) is unlocked
const userLearningObjectiveValidation = async (params, context) => {
  // userLearningObjective collection is used to store and get chat and pq page info
  // checking if called lo and user combination is accessible
  const { message } = topicTypes;
  await isComponentUnlocked(
    params,
    '',
    context,
    message,
  );
  return true;
};

export default userLearningObjectiveValidation;

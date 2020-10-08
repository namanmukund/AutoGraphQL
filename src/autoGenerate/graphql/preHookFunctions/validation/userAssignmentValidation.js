import isComponentUnlocked from './utils/isComponentUnlocked';
import { topicTypes } from '../../../../../constants';

// prehook logic to check if requested userAssignment(user and topic id) is unlocked
const userAssignmentValidation = async (params, context, mutationOrQueryName) => {
  // check if the called user and topic is unlocked
  const { quiz } = topicTypes;
  await isComponentUnlocked(
    params,
    '',
    context,
    quiz,
    '',
    '',
    false,
    mutationOrQueryName,
  );
  return true;
};

export default userAssignmentValidation;

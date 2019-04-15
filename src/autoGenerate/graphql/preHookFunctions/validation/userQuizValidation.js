import isComponentUnlocked from './utils/isComponentUnlocked';
import { topicTypes } from '../../../../../constants';

// prehook logic to check if requested UserQuiz(user and topic id) is unlocked
const userQuizValidation = async (params, context) => {
  // check if the called user and topic is unlocked
  const { quiz } = topicTypes;
  await isComponentUnlocked(
    params,
    '',
    context,
    quiz,
  );
  return true;
};

export default userQuizValidation;

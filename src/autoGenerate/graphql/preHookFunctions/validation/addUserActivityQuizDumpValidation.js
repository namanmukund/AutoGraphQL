import isComponentUnlocked from './utils/isComponentUnlocked';
import { topicTypes } from '../../../../../constants';

// prehook logic to check if requested quiz(user and topic id) is unlocked
const addUserActivityQuizDumpValidation = async (params, mutationOrQueryName, context) => {
  // check if the called user and topic is unlocked
  const { quiz } = topicTypes;
  await isComponentUnlocked(
    params,
    mutationOrQueryName,
    context,
    quiz,
  );
  return true;
};

export default addUserActivityQuizDumpValidation;

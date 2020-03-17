import isComponentUnlocked from './utils/isComponentUnlocked';
import { topicTypes } from '../../../../../constants';

// prehook logic to check if requested PQ(user and LO id) is unlocked
const addUserActivityPQDumpValidation = async (params, mutationOrQueryName, context) => {
  // check if the called user and topic is unlocked
  const { practiceQuestion } = topicTypes;
  await isComponentUnlocked(
    params,
    mutationOrQueryName,
    context,
    practiceQuestion,
  );
  return true;
};

export default addUserActivityPQDumpValidation;

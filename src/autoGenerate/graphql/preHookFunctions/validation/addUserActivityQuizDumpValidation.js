import isComponentUnlocked from './utils/isComponentUnlocked';

// prehook logic to check if requested quiz(user and topic id) is unlocked
const addUserActivityQuizDumpValidation = async (params, mutationOrQueryName, context) => {
  // check if the called user and topic is unlocked
  await isComponentUnlocked(
    params,
    mutationOrQueryName,
    context,
    'quiz',
  );
  return true;
};

export default addUserActivityQuizDumpValidation;

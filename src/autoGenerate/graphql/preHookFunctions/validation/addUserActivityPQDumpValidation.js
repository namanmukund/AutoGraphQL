import isComponentUnlocked from './utils/isComponentUnlocked';

// prehook logic to check if requested PQ(user and LO id) is unlocked
const addUserActivityPQDumpValidation = async (params, mutationOrQueryName, context) => {
  // check if the called user and topic is unlocked
  await isComponentUnlocked(
    params,
    mutationOrQueryName,
    context,
    'practiceQuestion',
  );
  return true;
};

export default addUserActivityPQDumpValidation;

import isComponentUnlocked from './utils/isComponentUnlocked';

// prehook logic to check if requested chat(user and LO id) is unlocked
const addUserActivityChatDumpValidation = async (params, mutationOrQueryName, context) => {
  await isComponentUnlocked(
    params,
    mutationOrQueryName,
    context,
    'chat',
  );
  return true;
};

export default addUserActivityChatDumpValidation;

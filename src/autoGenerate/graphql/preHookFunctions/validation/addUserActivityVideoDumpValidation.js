import isComponentUnlocked from './utils/isComponentUnlocked';

// prehook logic to check if requested video(user and topic id) is unlocked
const addUserActivityVideoDumpValidation = async (params, mutationOrQueryName, context) => {
  // check if the called user and topic is unlocked
  await isComponentUnlocked(
    params,
    mutationOrQueryName,
    context,
    'video',
  );
  return true;
};

export default addUserActivityVideoDumpValidation;

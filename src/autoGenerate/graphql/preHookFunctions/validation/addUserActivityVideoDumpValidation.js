import isComponentUnlocked from './utils/isComponentUnlocked';
import { topicTypes } from '../../../../../constants';

// prehook logic to check if requested video(user and topic id) is unlocked
const addUserActivityVideoDumpValidation = async (params, mutationOrQueryName, context) => {
  // check if the called user and topic is unlocked
  const { video } = topicTypes;
  await isComponentUnlocked(
    params,
    mutationOrQueryName,
    context,
    video,
  );
  return true;
};

export default addUserActivityVideoDumpValidation;

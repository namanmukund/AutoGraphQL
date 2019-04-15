import isComponentUnlocked from './utils/isComponentUnlocked';
import { topicTypes } from '../../../../../constants';

// prehook logic to check if requested UserVideo(user and topic id) is unlocked
const userVideoValidation = async (params, context) => {
  // userVideo collection is used to store and get video page info
  // checking if called topic and user combination in accessible
  const { video } = topicTypes;
  await isComponentUnlocked(
    params,
    '',
    context,
    video,
  );
  return true;
};

export default userVideoValidation;

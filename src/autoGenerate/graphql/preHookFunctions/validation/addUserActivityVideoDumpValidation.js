import {
  UserMismatchError,
  UserOrTopicNotPresentError,
} from '../../../../../constants/errors';
import isComponentUnlocked from './utils/isComponentUnlocked';
import getInfoFromContext from './utils/getInfoFromContext';

// prehook logic to check if requested video(user and topic id) is unlocked
const addUserActivityVideoDumpValidation = async (params, mutationOrQueryName, context) => {
  // check if the called user and topic is unlocked
  /*
  Calling method to validate token and retun userId and isRequestFromBackend
  we will compare this userId against userId passed in input
  both should be equal to perform action
  */
  const contextInfo = getInfoFromContext(context);
  const {
    userIdFromContext,
    isRequestFromBackend,
  } = contextInfo;
  const {
    userConnectId: userId,
    topicConnectId: topicId,
  } = params;
  if (!userId || !topicId) {
    throw new UserOrTopicNotPresentError();
  }
  if (isRequestFromBackend && userIdFromContext !== userId) {
    throw new UserMismatchError();
  }
  await isComponentUnlocked(
    userId,
    '',
    topicId,
    mutationOrQueryName,
    context,
    'video',
  );
  return true;
};

export default addUserActivityVideoDumpValidation;

import {
  UserMismatchError,
  UserOrLearningObjectiveNotPresentError,
} from '../../../../../constants/errors';
import isComponentUnlocked from './utils/isComponentUnlocked';
import getInfoFromContext from './utils/getInfoFromContext';

// prehook logic to check if requested PQ(user and LO id) is unlocked
const addUserActivityPQDumpValidation = async (params, mutationOrQueryName, context) => {
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
    learningObjectiveConnectId: learningObjectiveId,
  } = params;
  if (!userId || !learningObjectiveId) {
    throw new UserOrLearningObjectiveNotPresentError();
  }
  if (isRequestFromBackend && userIdFromContext !== userId) {
    throw new UserMismatchError();
  }
  await isComponentUnlocked(
    userId,
    learningObjectiveId,
    '',
    mutationOrQueryName,
    context,
    'practiceQuestion',
  );
  return true;
};

export default addUserActivityPQDumpValidation;

import isComponentUnlocked from './utils/isComponentUnlocked';
import { topicTypes } from '../../../../../constants';

// prehook logic to check if requested chat(user and LO id) is unlocked
const addUserActivityChatDumpValidation = async (params, mutationOrQueryName, context) => {
  const { message } = topicTypes;
  await isComponentUnlocked(
    params,
    mutationOrQueryName,
    context,
    message,
  );
  return true;
};

export default addUserActivityChatDumpValidation;

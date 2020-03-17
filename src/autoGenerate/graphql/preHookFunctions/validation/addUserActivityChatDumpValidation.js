import isComponentUnlocked from './utils/isComponentUnlocked';
import { topicTypes } from '../../../../../constants';
import { validateMentorMenteePermission } from './utils';

// prehook logic to check if requested chat(user and LO id) is unlocked
const addUserActivityChatDumpValidation = async (params, mutationOrQueryName, context) => {
  // check if user has permission to hit API according to his role, if user is mentee and there is
  // no mentor token, he should not be able to hit API
  validateMentorMenteePermission(
    context,
  );

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

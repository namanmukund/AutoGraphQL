import isComponentUnlocked from './utils/isComponentUnlocked';
import { topicTypes } from '../../../../../constants';
import { validateMentorMenteePermission } from './utils';

// prehook logic to check if requested quiz(user and topic id) is unlocked
const addUserActivityQuizDumpValidation = async (params, mutationOrQueryName, context) => {
  // check if user has permission to hit API according to his role, if user is mentee and there is
  // no mentor token, he should not be able to hit API
  validateMentorMenteePermission(
    context,
  );

  // check if the called user and topic is unlocked
  const { quiz } = topicTypes;
  await isComponentUnlocked(
    params,
    mutationOrQueryName,
    context,
    quiz,
  );
  return true;
};

export default addUserActivityQuizDumpValidation;

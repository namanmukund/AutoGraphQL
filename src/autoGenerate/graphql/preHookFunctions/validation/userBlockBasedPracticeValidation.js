import { topicTypes } from '../../../../../constants';
import isComponentUnlockedForNewCourse from './utils/isComponentUnlockedForNewCourse';
import getInfoFromParams from '../../postHookFunctions/utils/getInfoFromParams';

// prehook logic to check if requested UserQuiz(user and topic id) is unlocked
const userBlockBasedPracticeValidation = async (params, context) => {
  const {
    courseId,
  } = getInfoFromParams(params, 'blockBasedPractice');
  // check if the called user and topic is unlocked
  const { blockBasedPractice } = topicTypes;
  await isComponentUnlockedForNewCourse(
    params,
    '',
    context,
    blockBasedPractice,
    '',
    '',
    '',
    courseId,
  );
  return true;
};

export default userBlockBasedPracticeValidation;

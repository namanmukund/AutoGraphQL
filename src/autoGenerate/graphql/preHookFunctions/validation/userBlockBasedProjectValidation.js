import { topicTypes } from '../../../../../constants';
import isComponentUnlockedForNewCourse from './utils/isComponentUnlockedForNewCourse';
import getInfoFromParams from '../../postHookFunctions/utils/getInfoFromParams';

// prehook logic to check if requested UserQuiz(user and topic id) is unlocked
const userBlockBasedProjectValidation = async (params, context) => {
  const {
    courseId,
  } = getInfoFromParams(params, 'blockBasedProject');
  // check if the called user and topic is unlocked
  const { blockBasedProject } = topicTypes;
  await isComponentUnlockedForNewCourse(
    params,
    '',
    context,
    blockBasedProject,
    '',
    '',
    '',
    courseId,
  );
  return true;
};

export default userBlockBasedProjectValidation;

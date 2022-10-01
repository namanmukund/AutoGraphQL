import { topicTypes } from '../../../../../constants';
import isComponentUnlockedForNewCourse from './utils/isComponentUnlockedForNewCourse';
import getInfoFromParams from '../../postHookFunctions/utils/getInfoFromParams';
import { validateTokenAndExtractInformation } from './utils';

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
  const userInfo = validateTokenAndExtractInformation(context, false);
  const {
    currentUser,
  } = userInfo;
  context.userRoleFromContext = currentUser && currentUser.role;
  return true;
};

export default userBlockBasedPracticeValidation;

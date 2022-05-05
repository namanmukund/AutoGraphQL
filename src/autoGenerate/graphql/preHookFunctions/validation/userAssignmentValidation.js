import isComponentUnlocked from './utils/isComponentUnlocked';
import { OLD_COURSE_ID, topicTypes } from '../../../../../constants';
import isComponentUnlockedForNewCourse from './utils/isComponentUnlockedForNewCourse';
import getInfoFromParams from '../../postHookFunctions/utils/getInfoFromParams';
import { validateTokenAndExtractInformation } from './utils';

// prehook logic to check if requested userAssignment(user and topic id) is unlocked
const userAssignmentValidation = async (params, context, mutationOrQueryName) => {
  // check if the called user and topic is unlocked
  const { quiz } = topicTypes;
  const {
    courseId,
  } = getInfoFromParams(params, 'quiz');
  if (!courseId || (courseId === OLD_COURSE_ID)) {
    await isComponentUnlocked(
      params,
      '',
      context,
      quiz,
      '',
      '',
      false,
      mutationOrQueryName,
    );
  } else {
    await isComponentUnlockedForNewCourse(
      params,
      '',
      context,
      quiz,
      '',
      '',
      false,
      courseId,
    );
  }

  const userInfo = validateTokenAndExtractInformation(context, false);
  const {
    currentUser,
  } = userInfo;
  context.userRoleFromContext = currentUser && currentUser.role;
  return true;
};

export default userAssignmentValidation;

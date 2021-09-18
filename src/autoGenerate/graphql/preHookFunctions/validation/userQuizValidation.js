import isComponentUnlocked from './utils/isComponentUnlocked';
import { OLD_COURSE_ID, topicTypes } from '../../../../../constants';
import isComponentUnlockedForNewCourse from './utils/isComponentUnlockedForNewCourse';
import getInfoFromParams from '../../postHookFunctions/utils/getInfoFromParams';

// prehook logic to check if requested UserQuiz(user and topic id) is unlocked
const userQuizValidation = async (params, context) => {
  const {
    courseId,
  } = getInfoFromParams(params, 'quiz');
  // check if the called user and topic is unlocked
  const { quiz } = topicTypes;
  if (!courseId || (courseId === OLD_COURSE_ID)) {
    await isComponentUnlocked(
      params,
      '',
      context,
      quiz,
    );
  } else {
    await isComponentUnlockedForNewCourse(
      params,
      '',
      context,
      quiz,
      '',
      '',
      '',
      courseId,
    );
  }
  return true;
};

export default userQuizValidation;

import isComponentUnlocked from './utils/isComponentUnlocked';
import { OLD_COURSE_ID, topicTypes } from '../../../../../constants';
import isComponentUnlockedForNewCourse from './utils/isComponentUnlockedForNewCourse';
import getInfoFromParams from '../../postHookFunctions/utils/getInfoFromParams';

// prehook logic to check if requested UserLO(user and LO id) is unlocked
const userLearningObjectiveValidation = async (params, context) => {
  const {
    courseId,
  } = getInfoFromParams(params, 'learningObjective');
  // userLearningObjective collection is used to store and get chat and pq page info
  // checking if called lo and user combination is accessible
  const { message } = topicTypes;
  if (!courseId || (courseId !== OLD_COURSE_ID)) {
    await isComponentUnlocked(
      params,
      '',
      context,
      message,
    );
  } else {
    await isComponentUnlockedForNewCourse(
      params,
      '',
      context,
      message,
      '',
      '',
      '',
      courseId,
    );
  }

  return true;
};

export default userLearningObjectiveValidation;

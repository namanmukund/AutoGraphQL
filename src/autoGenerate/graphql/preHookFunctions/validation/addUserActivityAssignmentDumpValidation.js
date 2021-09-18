import { get } from 'lodash';
import { isComponentUnlocked } from './utils';
import { OLD_COURSE_ID, topicTypes } from '../../../../../constants';
import isComponentUnlockedForNewCourse from './utils/isComponentUnlockedForNewCourse';

// prehook logic to check if requested assignment(user and topic id) is unlocked
const addUserActivityAssignmentDumpValidation = async (params, mutationOrQueryName, context) => {
  // check if the called user and topic is unlocked
  const { quiz } = topicTypes;
  const courseId = get(params, 'courseConnectId');
  if (!courseId || (courseId === OLD_COURSE_ID)) {
    await isComponentUnlocked(
      params,
      mutationOrQueryName,
      context,
      quiz,
    );
  } else {
    await isComponentUnlockedForNewCourse(
      params,
      mutationOrQueryName,
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

export default addUserActivityAssignmentDumpValidation;

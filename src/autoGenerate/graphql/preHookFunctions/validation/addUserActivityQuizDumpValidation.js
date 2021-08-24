import { get } from 'lodash';
import { isComponentUnlocked } from './utils';
import { backendApps, OLD_COURSE_ID, topicTypes } from '../../../../../constants';
import isComponentUnlockedForNewCourse from './utils/isComponentUnlockedForNewCourse';

// prehook logic to check if requested quiz(user and topic id) is unlocked
const addUserActivityQuizDumpValidation = async (params, mutationOrQueryName, context) => {
  // check if the called user and topic is unlocked
  const { quiz } = topicTypes;
  const currentApp = get(context, 'currentApp.name');
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
      currentApp !== backendApps[0],
      courseId,
    );
  }
  return true;
};

export default addUserActivityQuizDumpValidation;

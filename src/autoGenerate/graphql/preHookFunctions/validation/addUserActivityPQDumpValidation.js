import { get } from 'lodash';
import { isComponentUnlocked } from './utils';
import { backendApps, OLD_COURSE_ID, topicTypes } from '../../../../../constants';
import isComponentUnlockedForNewCourse from './utils/isComponentUnlockedForNewCourse';

// prehook logic to check if requested PQ(user and LO id) is unlocked
const addUserActivityPQDumpValidation = async (params, mutationOrQueryName, context) => {
  // check if the called user and topic is unlocked
  const { practiceQuestion } = topicTypes;
  const currentApp = get(context, 'currentApp.name');
  const courseId = get(params, 'courseConnectId');
  if (!courseId || (courseId === OLD_COURSE_ID)) {
    await isComponentUnlocked(
      params,
      mutationOrQueryName,
      context,
      practiceQuestion,
    );
  } else {
    await isComponentUnlockedForNewCourse(
      params,
      mutationOrQueryName,
      context,
      practiceQuestion,
      '',
      '',
      currentApp !== backendApps[0],
      courseId,
    );
  }
  return true;
};

export default addUserActivityPQDumpValidation;

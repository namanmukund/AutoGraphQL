import { get } from 'lodash';
import { isComponentUnlocked } from './utils';
import { backendApps, OLD_COURSE_ID, topicTypes } from '../../../../../constants';
import isComponentUnlockedForNewCourse from './utils/isComponentUnlockedForNewCourse';

// prehook logic to check if requested chat(user and LO id) is unlocked
const addUserActivityChatDumpValidation = async (params, mutationOrQueryName, context) => {
  const { message } = topicTypes;
  const currentApp = get(context, 'currentApp.name');
  const courseId = get(params, 'courseConnectId');
  if (!courseId || (courseId === OLD_COURSE_ID)) {
    await isComponentUnlocked(
      params,
      mutationOrQueryName,
      context,
      message,
    );
  } else {
    await isComponentUnlockedForNewCourse(
      params,
      mutationOrQueryName,
      context,
      message,
      '',
      '',
      currentApp !== backendApps[0],
      courseId,
    );
  }
  return true;
};

export default addUserActivityChatDumpValidation;

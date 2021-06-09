import { get } from 'lodash';
import { isComponentUnlocked } from './utils';
import { backendApps, OLD_COURSE_ID, topicTypes } from '../../../../../constants';
import isComponentUnlockedForNewCourse from './utils/isComponentUnlockedForNewCourse';

// prehook logic to check if requested video(user and topic id) is unlocked
const addUserActivityVideoDumpValidation = async (params, mutationOrQueryName, context) => {
  // check if the called user and topic is unlocked
  const { video } = topicTypes;
  const currentApp = get(context, 'currentApp.name');
  const courseId = get(params, 'courseConnectId');
  // checkForPaidLogic is added in isComponentUnlocked to check
  // if we need to validate component for payment, if call for addUserActivityVideoDump is made from
  // backend application, we will not check for paid component logic since we will be skipping
  // the video with status as skipped
  if (!courseId || (courseId !== OLD_COURSE_ID)) {
    await isComponentUnlocked(
      params,
      mutationOrQueryName,
      context,
      video,
      '',
      '',
      currentApp !== backendApps[0],
    );
  } else {
    await isComponentUnlockedForNewCourse(
      params,
      mutationOrQueryName,
      context,
      video,
      '',
      '',
      currentApp !== backendApps[0],
      courseId,
    );
  }
  return true;
};

export default addUserActivityVideoDumpValidation;

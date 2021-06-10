import { get } from 'lodash';
import { topicTypes } from '../../../../../constants';
import isComponentUnlockedForNewCourse from './utils/isComponentUnlockedForNewCourse';

// prehook logic to check if requested blockBasedProject(user, blockBasedProject Id and topic id) is unlocked
const addUserActivityBlockBasedProjectDumpValidation = async (params, mutationOrQueryName, context) => {
  const courseId = get(params, 'courseConnectId');
  // check if the called user and topic is unlocked
  const { blockBasedProject } = topicTypes;
  // checkForPaidLogic is added in isComponentUnlocked to check
  // if we need to validate component for payment, if call for addUserActivityBlockBasedProjectDumpValidation is made from
  // backend application, we will not check for paid component logic since we will be skipping
  // the blockBasedProject with status as skipped
  await isComponentUnlockedForNewCourse(
    params,
    mutationOrQueryName,
    context,
    blockBasedProject,
    '',
    '',
    '',
    courseId,
  );
  return true;
};

export default addUserActivityBlockBasedProjectDumpValidation;

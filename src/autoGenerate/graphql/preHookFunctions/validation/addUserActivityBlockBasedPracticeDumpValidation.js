import { get } from 'lodash';
import { topicTypes } from '../../../../../constants';
import isComponentUnlockedForNewCourse from './utils/isComponentUnlockedForNewCourse';

// prehook logic to check if requested blockBasedPractice(user, blockBasedPractice Id and topic id) is unlocked
const addUserActivityBlockBasedPracticeDumpValidation = async (params, mutationOrQueryName, context) => {
  const courseId = get(params, 'courseConnectId');
  // check if the called user and topic is unlocked
  const { blockBasedPractice } = topicTypes;
  // checkForPaidLogic is added in isComponentUnlocked to check
  // if we need to validate component for payment, if call for addUserActivityBlockBasedPracticeDumpValidation is made from
  // backend application, we will not check for paid component logic since we will be skipping
  // the blockBasedPractice with status as skipped
  await isComponentUnlockedForNewCourse(
    params,
    mutationOrQueryName,
    context,
    blockBasedPractice,
    '',
    '',
    '',
    courseId,
  );
  return true;
};

export default addUserActivityBlockBasedPracticeDumpValidation;

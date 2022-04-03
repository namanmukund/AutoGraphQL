import { get } from 'lodash';
import { topicTypes } from '../../../../../constants';
import isComponentUnlockedForNewCourse from './utils/isComponentUnlockedForNewCourse';

// prehook logic to check if requested Learning slide(user and LO id) is unlocked
const addUserLearningSlideDumpValidation = async (params, mutationOrQueryName, context) => {
  // check if the called user and topic is unlocked
  const { learningSlide } = topicTypes;
  const courseId = get(params, 'courseConnectId');
  await isComponentUnlockedForNewCourse(
    params,
    mutationOrQueryName,
    context,
    learningSlide,
    '',
    '',
    '',
    courseId,
  );
  return true;
};

export default addUserLearningSlideDumpValidation;

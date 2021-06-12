import { get } from 'lodash';
import { topicTypes } from '../../../../../constants';
import isComponentUnlockedForNewCourse from './utils/isComponentUnlockedForNewCourse';

// prehook logic to check if requested comic strip(user and LO id) is unlocked
const addUserActivityComicStripDumpValidation = async (params, mutationOrQueryName, context) => {
  const courseId = get(params, 'courseConnectId');
  const learningObjectiveId = get(params, 'learningObjectiveConnectId');
  const { comicStrip } = topicTypes;
  await isComponentUnlockedForNewCourse(
    params,
    mutationOrQueryName,
    context,
    comicStrip,
    '',
    learningObjectiveId,
    '',
    courseId,
  );
  return true;
};

export default addUserActivityComicStripDumpValidation;

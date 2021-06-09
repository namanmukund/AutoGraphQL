import { get } from 'lodash';
import { topicTypes } from '../../../../../constants';
import isComponentUnlockedForNewCourse from './utils/isComponentUnlockedForNewCourse';

// prehook logic to check if requested comic strip(user and LO id) is unlocked
const addUserActivityComicStripDumpValidation = async (params, mutationOrQueryName, context) => {
  const courseId = get(params, 'courseConnectId');
  const { comicStrip } = topicTypes;
  await isComponentUnlockedForNewCourse(
    params,
    mutationOrQueryName,
    context,
    comicStrip,
    '',
    '',
    '',
    courseId,
  );
  return true;
};

export default addUserActivityComicStripDumpValidation;

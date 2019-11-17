import { get } from 'lodash';
import isComponentUnlocked from './utils/isComponentUnlocked';
import { backendApps, topicTypes } from '../../../../../constants';

// prehook logic to check if requested video(user and topic id) is unlocked
const addUserActivityVideoDumpValidation = async (params, mutationOrQueryName, context) => {
  // check if the called user and topic is unlocked
  const { video } = topicTypes;
  const decodedApp = get(context, 'decodedApp.name');
  // checkForPaidLogic is added in isComponentUnlocked to check
  // if we need to validate component for payment, if call for addUserActivityVideoDump is made from
  // backend application, we will not check for paid component logic since we will be skipping
  // the video with status as skipped
  await isComponentUnlocked(
    params,
    mutationOrQueryName,
    context,
    video,
    '',
    '',
    decodedApp !== backendApps[0],
  );
  return true;
};

export default addUserActivityVideoDumpValidation;

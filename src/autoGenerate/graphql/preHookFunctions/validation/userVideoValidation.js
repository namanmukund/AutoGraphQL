import { get } from 'lodash';
import isComponentUnlocked from './utils/isComponentUnlocked';
import { backendApps, topicTypes } from '../../../../../constants';

// prehook logic to check if requested UserVideo(user and topic id) is unlocked
const userVideoValidation = async (params, context) => {
  // userVideo collection is used to store and get video page info
  // checking if called topic and user combination in accessible
  const { video } = topicTypes;
  const currentApp = get(context, 'currentApp.name');
  // checkForPaidLogic is added in isComponentUnlocked to check
  // if we need to validate component for payment, if call for addUserActivityVideoDump is made from
  // backend application, we will not check for paid component logic since we will be skipping
  // the video with status as skipped
  await isComponentUnlocked(
    params,
    '',
    context,
    video,
    '',
    '',
    currentApp !== backendApps[0],
  );
  return true;
};

export default userVideoValidation;

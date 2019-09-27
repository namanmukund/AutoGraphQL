import { get } from 'lodash';
import isComponentUnlocked from './utils/isComponentUnlocked';
import { backendApps, topicTypes } from '../../../../../constants';

// prehook logic to check if requested UserVideo(user and topic id) is unlocked
const userVideoValidation = async (params, context) => {
  // userVideo collection is used to store and get video page info
  // checking if called topic and user combination in accessible
  const { video } = topicTypes;
  const decodedApp = get(context, 'decodedApp.name');
  await isComponentUnlocked(
    params,
    '',
    context,
    video,
    '',
    '',
    decodedApp !== backendApps[0],
  );
  return true;
};

export default userVideoValidation;

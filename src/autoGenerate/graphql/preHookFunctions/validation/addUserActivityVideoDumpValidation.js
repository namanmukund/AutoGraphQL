import { get } from 'lodash';
import isComponentUnlocked from './utils/isComponentUnlocked';
import { backendApps, topicTypes } from '../../../../../constants';

// prehook logic to check if requested video(user and topic id) is unlocked
const addUserActivityVideoDumpValidation = async (params, mutationOrQueryName, context) => {
  // check if the called user and topic is unlocked
  const { video } = topicTypes;
  const decodedApp = get(context, 'decodedApp.name');
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

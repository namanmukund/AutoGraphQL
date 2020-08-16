import { prehook } from '../../../preHook';
import { userTopicJourneyMutationResolver } from '../index';
import { toObject } from '../../../../../../utils';

const userTopicJourney = async (root, params, context, info) => {
  const typeName = 'UserCurrentTopicComponentStatus';
  const mutationName = 'userTopicJourney';

  const hookInput = await prehook(params, mutationName, context, params);

  return userTopicJourneyMutationResolver(
    root,
    hookInput,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    context,
    params,
  ).then((result) => toObject(result));
};

export default userTopicJourney;

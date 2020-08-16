import { prehook } from '../../../preHook';
import { userBadgeMutationResolver } from '../index';
import { toObject } from '../../../../../../utils';

const userBadge = async (root, params, context, info) => {
  const typeName = 'UserCurrentTopicComponentStatus';
  const mutationName = 'userBadge';

  const hookInput = await prehook(params, mutationName, context, params);

  return userBadgeMutationResolver(
    root,
    hookInput,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    context,
  ).then((result) => toObject(result));
};

export default userBadge;

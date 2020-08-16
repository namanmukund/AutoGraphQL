import { prehook } from '../../../preHook';
import { getUnlockedUserBadgeMutationResolver } from '../index';
import { toObject } from '../../../../../../utils';

const getUnlockedUserBadge = async (root, params, context, info) => {
  const typeName = 'GetUnlockedUserBadge';
  const mutationName = 'getUnlockedUserBadge';
  const { parsedASTMap } = context;
  const { input } = params;
  const hookInput = await prehook(input, mutationName, context, params);

  return getUnlockedUserBadgeMutationResolver(
    root,
    hookInput,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    context,
  ).then((result) => toObject(result));
};

export default getUnlockedUserBadge;

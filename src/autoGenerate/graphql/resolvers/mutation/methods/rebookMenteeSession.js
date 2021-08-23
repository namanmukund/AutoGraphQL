import { rebookMenteeSessionMutationResolver } from '../index';
import { toObject } from '../../../../../../utils';

const rebookMenteeSession = async (root, params, context, info) => {
  const typeName = 'rebookMenteeSession';
  const mutationName = 'rebookMenteeSession';
  const { parsedASTMap } = context;

  return rebookMenteeSessionMutationResolver(
    root,
    params,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    context,
  ).then((result) => toObject(result));
};

export default rebookMenteeSession;

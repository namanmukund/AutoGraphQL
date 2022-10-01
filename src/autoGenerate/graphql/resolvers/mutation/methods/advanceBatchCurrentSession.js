import { toObject } from '../../../../../../utils';
import advanceBatchCurrentSessionMutationResolver from '../userData/advanceBatchCurrentSessionMutationResolver';

const advanceBatchCurrentSession = async (root, params, context, info) => {
  const typeName = 'Batch';
  const mutationName = 'advanceBatchCurrentSession';
  const { parsedASTMap } = context;

  return advanceBatchCurrentSessionMutationResolver(
    root,
    params,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    context,
  ).then((result) => toObject(result));
};

export default advanceBatchCurrentSession;

import { getTotalAmountCollectedMutationResolver } from '../index';
import { toObject } from '../../../../../../utils';

const getTotalAmountCollected = async (root, params, context, info) => {
  const typeName = 'TotalAmountCollected';
  const mutationName = 'getTotalAmountCollected';
  const { parsedASTMap } = context;

  return getTotalAmountCollectedMutationResolver(
    root,
    params,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    context,
  ).then((result) => toObject(result));
};

export default getTotalAmountCollected;

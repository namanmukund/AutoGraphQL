import { ifAuthorized, toObject } from '../../../../../../utils';
import shiftBatchSessionsMutationResolver from '../shift/shiftBatchSessionsAfterGivenDate';

const shiftBatchSessionsAfterGivenDate = async (root, params, context, info) => {
  const { parsedASTMap } = context;
  const authentication = ifAuthorized(context);
  console.log('context', context);
  const typeName = 'shiftBatchSessionsAfterGivenDate';
  const mutationName = 'shiftBatchSessionsAfterGivenDate';

  return shiftBatchSessionsMutationResolver(
    root,
    params,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    authentication,
    context,
  ).then((result) => toObject(result));
};

export default shiftBatchSessionsAfterGivenDate;

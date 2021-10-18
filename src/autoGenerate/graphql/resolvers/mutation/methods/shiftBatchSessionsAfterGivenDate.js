import { ifAuthorized, toObject } from '../../../../../../utils';

const shiftBatchSessionsAfterGivenDate = async (root, params, context, info) => {
  const { parsedASTMap } = context;
  const authentication = ifAuthorized(context);
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
  ).then((result) => toObject(result));
};

export default shiftBatchSessionsAfterGivenDate;

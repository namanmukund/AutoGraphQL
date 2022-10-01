import { ifAuthorized, toObject } from '../../../../../../utils';
import generateBatchSessionOtpMutationResolver from '../userData/generateBatchSessionOtpMutationResolver';

const generateBatchSessionOtp = async (root, params, context, info) => {
  const typeName = 'Batch';
  const mutationName = 'generateBatchSessionOtp';
  const { parsedASTMap } = context;
  const authentication = ifAuthorized(context);

  return generateBatchSessionOtpMutationResolver(
    root,
    params,
    authentication,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    context,
  ).then((result) => toObject(result));
};

export default generateBatchSessionOtp;

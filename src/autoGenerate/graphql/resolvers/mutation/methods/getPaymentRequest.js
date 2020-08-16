import { getPaymentRequestMutationResolver } from '../index';
import { toObject } from '../../../../../../utils';

const getPaymentRequest = async (root, params, context, info) => {
  const typeName = 'PaymentRequest';
  const mutationName = 'getPaymentRequest';

  return getPaymentRequestMutationResolver(
    root,
    params,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    context,
  ).then((result) => toObject(result));
};

export default getPaymentRequest;

import { getPaymentResponseMutationResolver } from '../index';
import { toObject } from '../../../../../../utils';

const getPaymentResponse = async (root, params, context, info) => {
  const typeName = 'PaymentResponse';
  const mutationName = 'getPaymentResponse';

  return getPaymentResponseMutationResolver(
    root,
    params,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    context,
  ).then((result) => toObject(result));
};

export default getPaymentResponse;

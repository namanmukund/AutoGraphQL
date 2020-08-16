import { ifAuthorized, toObject } from '../../../../../../utils';
import { prehook } from '../../../preHook';
import getSendResendForgotPasswordOTPInput from '../../../../utils/getSendResendForgotPasswordOTPInput';
import { sendForgotPasswordOTPMutationResolver } from '../index';

const sendForgotPasswordOTP = async (root, params, context, info) => {
  const authentication = ifAuthorized(context);
  const { parsedASTMap } = context;
  const typeName = 'User';
  const mutationName = 'sendForgotPasswordOTP';

  const hookInput = await prehook(params, mutationName, context, params);
  const newParams = getSendResendForgotPasswordOTPInput(hookInput);

  return sendForgotPasswordOTPMutationResolver(
    root,
    newParams,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    authentication,
  ).then((result) => toObject(result));
};

export default sendForgotPasswordOTP;

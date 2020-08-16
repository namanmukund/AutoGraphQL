import { ifAuthorized, toObject } from '../../../../../../utils';
import { prehook } from '../../../preHook';
import getSendResendForgotPasswordOTPInput from '../../../../utils/getSendResendForgotPasswordOTPInput';
import { resendForgotPasswordOTPMutationResolver } from '../index';

const resendForgotPasswordOTP = async (root, params, context, info) => {
  const authentication = ifAuthorized(context);
  const { parsedASTMap } = context;
  const typeName = 'User';
  const mutationName = 'resendForgotPasswordOTP';

  const hookInput = await prehook(params, mutationName, context, params);
  const newParams = getSendResendForgotPasswordOTPInput(hookInput);

  return resendForgotPasswordOTPMutationResolver(
    root,
    newParams,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    authentication,
  ).then((result) => toObject(result));
};

export default resendForgotPasswordOTP;

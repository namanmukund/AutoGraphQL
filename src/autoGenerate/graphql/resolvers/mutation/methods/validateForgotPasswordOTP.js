import { ifAuthorized, toObject } from '../../../../../../utils';
import { prehook } from '../../../preHook';
import { validateForgotPasswordOTPMutationResolver } from '../index';

const validateForgotPasswordOTP = async (root, params, context, info) => {
  const authentication = ifAuthorized(context);
  const typeName = 'User';
  const mutationName = 'validateForgotPasswordOTP';

  const hookInput = await prehook(params, mutationName, context, params);

  return validateForgotPasswordOTPMutationResolver(
    root,
    hookInput,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    authentication,
  ).then((result) => toObject(result));
};

export default validateForgotPasswordOTP;

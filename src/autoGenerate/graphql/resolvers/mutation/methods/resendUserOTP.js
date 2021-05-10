import { ifAuthorized, toObject } from '../../../../../../utils';
import { prehook } from '../../../preHook';
import { BYPASS } from '../../../../../../constants';
import { getPhoneOTP } from '../../../../../sms';
import { resendUserOTPResolver } from '../index';
import { posthook } from '../../../postHook';

const resendUserOTP = async (root, params, context, info) => {
  const authentication = ifAuthorized(context);
  const { parsedASTMap } = context;
  const typeName = 'User';
  const mutationName = 'resendUserOTP';
  Object.assign(authentication, {
    mutationOrQueryName: mutationName,
  });
  const hookInput = await prehook(params, mutationName, context, params);

  if (hookInput.status && hookInput.status === BYPASS) {
    authentication.user.status = BYPASS;
    delete hookInput.status;
  }
  const newParams = getPhoneOTP(hookInput);

  return resendUserOTPResolver(
    root,
    newParams,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    authentication,
  ).then((result) => {
    const newResult = toObject(result);
    return posthook(newResult, mutationName);
  });
};

export default resendUserOTP;

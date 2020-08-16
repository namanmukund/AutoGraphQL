import { ifAuthorized, toObject } from '../../../../../../utils';
import { prehook } from '../../../preHook';
import { getNumberAndSendSms, getPhoneOTP } from '../../../../../sms';
import { signupMutationResolver } from '../index';
import { posthook } from '../../../postHook';

const signUp = async (root, params, context, info) => {
  const { parsedASTMap } = context;
  const authentication = ifAuthorized(context);
  const typeName = 'User';
  const mutationName = 'signUp';
  const { input } = params;
  const hookInput = await prehook(input, mutationName, context, params);
  const newParams = params;
  newParams.input = getPhoneOTP(hookInput);

  return signupMutationResolver(
    root,
    newParams,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    authentication,
  ).then((result) => {
    const newResult = toObject(result);
    const { name } = newResult;
    getNumberAndSendSms(hookInput, name);

    return posthook(newResult, mutationName);
  });
};

export default signUp;

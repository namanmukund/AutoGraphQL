import { ifAuthorized, toObject } from '../../../../../../utils';
import { prehook } from '../../../preHook';
import signupOrLoginViaOtpMutationResolver from '../user/signupOrLoginViaOtp';
import { posthook } from '../../../postHook';

const signupOrLoginViaOtp = async (root, params, context, info) => {
  const authentication = ifAuthorized(context);
  const typeName = 'User';
  const mutationName = 'signupOrLoginViaOtp';
  const { parsedASTMap } = context;

  const { input } = params;
  const hookInput = await prehook(input, mutationName, context, params);

  const newParams = params;
  newParams.input = hookInput;

  return signupOrLoginViaOtpMutationResolver(
    root,
    params,
    context,
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

export default signupOrLoginViaOtp;

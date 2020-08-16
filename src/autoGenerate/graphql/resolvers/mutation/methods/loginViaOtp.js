import { ifAuthorized, toObject } from '../../../../../../utils';
import { prehook } from '../../../preHook';
import loginViaOtpMutationResolver from '../user/loginViaOtp';
import { posthook } from '../../../postHook';

const loginViaOtp = async (root, params, context, info) => {
  const authentication = ifAuthorized(context);
  const typeName = 'User';
  const mutationName = 'loginViaOtp';
  const { parsedASTMap } = context;

  const { input } = params;
  const hookInput = await prehook(input, mutationName, context, params);

  const newParams = params;
  newParams.input = hookInput;

  return loginViaOtpMutationResolver(
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

export default loginViaOtp;

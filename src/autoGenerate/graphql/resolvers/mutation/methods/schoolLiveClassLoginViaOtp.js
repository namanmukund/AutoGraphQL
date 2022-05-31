import { ifAuthorized, toObject } from '../../../../../../utils';
import { prehook } from '../../../preHook';
import schoolLiveClassLoginViaOtpMutationResolver from '../user/schoolLiveClassLoginViaOtp';
import { posthook } from '../../../postHook';

const schoolLiveClassLoginViaOtp = async (root, params, context, info) => {
  const authentication = ifAuthorized(context);
  const typeName = 'User';
  const mutationName = 'schoolLiveClassLoginViaOtp';
  const { parsedASTMap } = context;

  const { input } = params;
  const hookInput = await prehook(input, mutationName, context, params);

  const newParams = params;
  newParams.input = hookInput;

  return schoolLiveClassLoginViaOtpMutationResolver(
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
    return posthook(newResult, mutationName, context, params);
  });
};

export default schoolLiveClassLoginViaOtp;

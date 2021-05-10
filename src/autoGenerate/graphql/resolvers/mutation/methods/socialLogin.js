import { ifAuthorized, toObject } from '../../../../../../utils';
import { prehook } from '../../../preHook';
import socialLoginMutationResolver from '../user/socialLogin';
import { posthook } from '../../../postHook';

const socialLogin = async (root, params, context, info) => {
  const authentication = ifAuthorized(context);
  const { parsedASTMap } = context;
  const typeName = 'User';
  const mutationName = 'socialLogin';
  const { input } = params;
  const hookInput = await prehook(input, mutationName, context, params);

  const newParams = params;
  newParams.input = hookInput;

  return socialLoginMutationResolver(
    root,
    params,
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

export default socialLogin;

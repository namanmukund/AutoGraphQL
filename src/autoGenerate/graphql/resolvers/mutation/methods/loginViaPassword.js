import { ifAuthorized, toObject } from '../../../../../../utils';
import { prehook } from '../../../preHook';
import loginViaPasswordMutationResolver from '../user/loginViaPassword';
import { posthook } from '../../../postHook';

const loginViaPassword = async (root, params, context, info) => {
  const authentication = ifAuthorized(context);
  const typeName = 'User';
  const mutationName = 'loginViaPassword';
  const { input } = params;
  const hookInput = await prehook(input, mutationName, context, params);

  const newParams = params;
  newParams.input = hookInput;

  return loginViaPasswordMutationResolver(
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

export default loginViaPassword;

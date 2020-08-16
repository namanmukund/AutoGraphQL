import { ifAuthorized, toObject } from '../../../../../../utils';
import { prehook } from '../../../preHook';
import { loginMutationResolver } from '../index';
import { posthook } from '../../../postHook';

const login = async (root, params, context, info) => {
  const authentication = ifAuthorized(context);
  const { parsedASTMap } = context;
  const typeName = 'User';
  const mutationName = 'login';
  const { input } = params;
  const hookInput = await prehook(input, mutationName, context, params);

  const newParams = params;
  newParams.input = hookInput;

  return loginMutationResolver(
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

export default login;

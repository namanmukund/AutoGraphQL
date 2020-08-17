import { ifAuthorized, toObject } from '../../../../../../utils';
import { prehook } from '../../../preHook';
import { parentChildSignUpMutationResolver } from '../index';
import { posthook } from '../../../postHook';

const parentChildSignUp = async (root, params, context, info) => {
  const { parsedASTMap } = context;
  const authentication = ifAuthorized(context);
  const typeName = 'User';
  const mutationName = 'parentChildSignUp';
  const { input } = params;
  const hookInput = await prehook(input, mutationName, context, params);

  const newParams = params;
  newParams.input = hookInput;

  return parentChildSignUpMutationResolver(
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

export default parentChildSignUp;

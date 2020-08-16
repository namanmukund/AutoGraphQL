import { ifAuthorized, toObject } from '../../../../../../utils';
import { prehook } from '../../../preHook';
import { finishForgotPasswordMutationResolver } from '../index';

const finishForgotPassword = async (root, params, context, info) => {
  const authentication = ifAuthorized(context);
  const typeName = 'User';
  const mutationName = 'finishForgotPassword';

  const hookInput = await prehook(params, mutationName, context, params);

  return finishForgotPasswordMutationResolver(
    root,
    hookInput,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    authentication,
  ).then((result) => toObject(result));
};

export default finishForgotPassword;

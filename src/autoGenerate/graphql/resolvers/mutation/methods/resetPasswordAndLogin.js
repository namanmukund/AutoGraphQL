import { ifAuthorized } from '../../../../../../utils';
import { prehook } from '../../../preHook';
import { resetPasswordAndLoginMutationResolver } from '../index';

const resetPasswordAndLogin = async (root, params, context, info) => {
  const authentication = ifAuthorized(context);
  const { parsedASTMap } = context;
  const typeName = 'User';
  const mutationName = 'resetPasswordAndLogin';

  const hookInput = await prehook(params, mutationName, context, params);

  return resetPasswordAndLoginMutationResolver(
    root,
    hookInput,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    authentication,
  );
};

export default resetPasswordAndLogin;

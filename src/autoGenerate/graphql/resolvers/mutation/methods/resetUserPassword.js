import { ifAuthorized } from '../../../../../../utils';
import { prehook } from '../../../preHook';
import { resetUserPasswordMutationResolver } from '../index';

const resetUserPassword = async (root, params, context, info) => {
  const authentication = ifAuthorized(context);
  const { parsedASTMap } = context;
  const typeName = 'User';
  const mutationName = 'resetUserPassword';

  const hookInput = await prehook(params, mutationName, context, params);

  return resetUserPasswordMutationResolver(
    root,
    hookInput,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    authentication,
  );
};

export default resetUserPassword;

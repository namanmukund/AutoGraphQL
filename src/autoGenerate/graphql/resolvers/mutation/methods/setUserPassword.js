import { ifAuthorized } from '../../../../../../utils';
import { prehook } from '../../../preHook';
import { setUserPasswordMutationResolver } from '../index';

const setUserPassword = async (root, params, context, info) => {
  const authentication = ifAuthorized(context);
  const { parsedASTMap } = context;
  const typeName = 'User';
  const mutationName = 'setUserPassword';

  const hookInput = await prehook(params, mutationName, context, params);
  return setUserPasswordMutationResolver(
    root,
    hookInput,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    authentication,
  );
};

export default setUserPassword;

import { ifAuthorized } from '../../../../../../utils';
import { isBackendApp } from '../../../validation';
import { UnauthorizedOperationError } from '../../../../../../constants/errors';
import { prehook } from '../../../preHook';
import { setUserPasswordMutationResolver } from '../index';

const tcirtSdrowssaPtes = async (root, params, context, info) => {
  const authentication = ifAuthorized(context);
  const { parsedASTMap } = context;
  const typeName = 'User';
  const mutationName = 'tcirtSdrowssaPtes';

  // Check strict authorization
  // Allow if backend app.
  if (!authentication || !authentication.app || !isBackendApp(authentication)) {
    throw new UnauthorizedOperationError();
  }

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

export default tcirtSdrowssaPtes;

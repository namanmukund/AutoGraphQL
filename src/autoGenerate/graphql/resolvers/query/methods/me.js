import { authenticateUser, ifAuthorized } from '../../../../../../utils';
import { UnauthorizedOperationError } from '../../../../../../constants/errors';
import { BYPASS } from '../../../../../../constants';
import { fetchSingleQueryResolver } from '../index';

const me = ((root, params, context, info) => {
  // Query Resolvers
  const authenticatedUser = authenticateUser(context);
  const authentication = ifAuthorized(context);
  const { parsedASTMap } = context;
  if (!authenticatedUser) {
    return null;
  }
  Object.assign(authentication, {
    mutationOrQueryName: 'me',
  });
  const { id } = authenticatedUser;
  const typeName = 'User';
  const queryParam = { id };

  // allow me query for inactive user and block for blocked user
  const { status } = authenticatedUser;
  switch (status) {
    case 'blocked':
      throw new UnauthorizedOperationError();
    case 'inactive':
      // this will prevent inactive status check for me query
      authentication.user.status = BYPASS;
      break;
    default:
  }

  return fetchSingleQueryResolver(
    root,
    queryParam,
    typeName,
    info,
    parsedASTMap,
    authentication,
  );
});

export default me;

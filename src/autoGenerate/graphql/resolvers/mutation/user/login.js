import {
  UserTokenNotRequiredError,
  BlockedOperationError,
  DatabaseRecordNotFoundError,
} from '../../../../../../constants/errors';
import { QueryController } from '../../../controllers';
import { getFieldsBeingFetched } from '../../../../utils';
import { validate } from '../../../validation';
import { checkPasswordAndReturnUserWithToken } from '../utils/checkPasswordAndReturnUserWithToken';
import { SINGULAR } from '../../../../../../constants/graphqlOperations';
import getUserFromDBQuery from './utils/getUserFromDBQuery';

export default function loginMutationResolver(
  root,
  params,
  typeName,
  info,
  mutationName,
  ast,
  authentication,
) {
  const { input } = params;
  const { fieldNodes } = info;
  const fieldsFetched = getFieldsBeingFetched(fieldNodes);

  validate(
    'UserToken',
    ast,
    SINGULAR,
    fieldsFetched,
    authentication,
    input,
  );
  const currentUser = authentication && authentication.user;
  // FIX: Should this not be a null check
  if (currentUser) {
    throw new UserTokenNotRequiredError();
  }
  // Setting user to true if not preset, as login does not require user authentication.
  Object.assign(authentication, {
    user: true,
  });
  // Create a new object id if there is no id.
  const modelQueries = new QueryController('User', authentication);

  return getUserFromDBQuery(
    input,
    modelQueries,
  ).then((fetchedUser) => {
    if (!fetchedUser) {
      throw new DatabaseRecordNotFoundError();
    }
    const data = checkPasswordAndReturnUserWithToken(fetchedUser, input, authentication);
    const { status } = fetchedUser;
    switch (status) {
      case 'blocked':
        throw new BlockedOperationError();
      case 'inactive':
        if (!input.username === fetchedUser.username) { throw new BlockedOperationError(); }
        break;
      case 'active':
      default:
    }
    return data;
  });
}

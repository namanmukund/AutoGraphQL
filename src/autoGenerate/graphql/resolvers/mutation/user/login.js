import { get } from 'lodash';
import {
  UserTokenNotRequiredError,
  BlockedOperationError,
  DatabaseRecordNotFoundError, InsufficientPermissionError,
} from '../../../../../../constants/errors';
import { QueryController } from '../../../controllers';
import { getFieldsBeingFetched } from '../../../../utils';
import { validate } from '../../../validation';
import { checkPasswordAndReturnUserWithToken } from '../utils/checkPasswordAndReturnUserWithToken';
import { SINGULAR } from '../../../../../../constants/graphqlOperations';
import getUserFromDBQuery from './utils/getUserFromDBQuery';
import { TWA } from '../../../../../../constants';
import { MENTOR } from '../../../../../../constants/roles';
import checkIfMentorIsAvailable from './utils/checkIfMentorIsAvailable';
import { MentorAvailabilitySlotNotBookedError } from '../../../../../../constants/errors/permissions';

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
  ).then(async (fetchedUser) => {
    if (!fetchedUser) {
      throw new DatabaseRecordNotFoundError();
    }
    const { id: userId, role } = fetchedUser;
    if (get(authentication, 'app.name') === TWA) {
      if (role !== MENTOR) {
        throw new InsufficientPermissionError();
      }
      // check if availability slots exist
      const isMentorAvailable = await checkIfMentorIsAvailable(userId);
      if (!isMentorAvailable) {
        throw new MentorAvailabilitySlotNotBookedError();
      }
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

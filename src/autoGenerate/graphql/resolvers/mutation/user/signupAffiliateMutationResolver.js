import {
  UserAlreadyExistsError,
  UserTokenNotRequiredError,
} from '../../../../../../constants/errors';
import { MutationController, QueryController } from '../../../controllers';
import { generateCuid } from '../../../../../../utils';
import { getFieldsBeingFetched } from '../../../../utils';
import { validate } from '../../../validation';
import localSignUpMutationPromise from '../utils/localSignUpMutationPromise';
import { createUserTokenTypeData } from '../utils/createUserTokenTypeData';
import { ADD } from '../../../../../../constants/graphqlOperations';
import { commonUserValidation } from '../../../preHookFunctions/validation/utils';
import getUserFromDBQuery from './utils/getUserFromDBQuery';
import { AFFILIATE } from '../../../../../../constants/roles';
import generateInviteCode from '../../../../../../utils/generateInviteCode';

const signupAffiliateMutationResolver = async (
  root,
  params,
  typeName,
  info,
  mutationName,
  ast,
  authentication,
) => {
  const { input } = params;
  const { fieldNodes } = info;
  const fieldsFetched = getFieldsBeingFetched(fieldNodes);

  validate(
    'UserToken',
    ast,
    ADD,
    fieldsFetched,
    authentication,
    {},
  );

  const currentUser = authentication && authentication.user;

  if (currentUser) {
    throw new UserTokenNotRequiredError();
  }

  const { name, email, phone } = input;
  commonUserValidation({ name, email, phone });

  Object.assign(authentication, {
    user: true,
  });
  const modelQueries = new QueryController('User', authentication);
  const userData = await getUserFromDBQuery(input, modelQueries);
  /* if password is already present or if password
    is not present and also user is not socially logged in
    */
  if (userData) {
    const { role, secondaryRole } = userData;
    /*
    -- If role is already affiliate
    -- If role is something else like parent and secondary role is affiliate
     */
    if (
      role === AFFILIATE
      || (role !== AFFILIATE && secondaryRole === AFFILIATE)
    ) {
      throw new UserAlreadyExistsError();
    }
    /*
    --If role is something  else and secondary role is not available make secondary role as AFFILIATE
     */
    const { id } = userData;
    const modelMutations = new MutationController(typeName, authentication);
    const result = await modelMutations.updateDocument(id, {
      secondaryRole: AFFILIATE,
      profession: input.profession,
      inviteCode: generateInviteCode(10),
    });
    // return user with token
    return createUserTokenTypeData(result, authentication, '', true);
  }
  /* Setting user to true if not preset, as signup
  does not require user authentication.
  */

  const cuidInput = generateCuid(input);
  const modelMutations = new MutationController(typeName, authentication);

  cuidInput.role = AFFILIATE;
  cuidInput.inviteCode = generateInviteCode(10);
  const result = await localSignUpMutationPromise(
    cuidInput,
    modelMutations,
  );

  // return user with token
  return createUserTokenTypeData(result, authentication, '', true);
};

export default signupAffiliateMutationResolver;

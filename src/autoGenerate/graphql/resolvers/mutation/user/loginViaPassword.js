import { getFieldsBeingFetched } from '../../../../utils';
import { validate } from '../../../validation';
import { SINGULAR } from '../../../../../../constants/graphqlOperations';
import {
  DatabaseRecordNotFoundError,
  EitherUsernameEmailOrPhoneRequiredError,
  InvalidEmailError,
  UserTokenNotRequiredError,
} from '../../../../../../constants/errors';
import isValidEmail from '../../../validation/isValidEmail';
import { MENTOR, PARENT } from '../../../../../../constants/roles';
import { QueryController } from '../../../controllers';
import { getUserFromDBQuery } from './utils';
import { checkPasswordAndReturnUserWithToken } from '../utils/checkPasswordAndReturnUserWithToken';
import getChildrenToken from './utils/getChildrenToken';
import { EmailOrUsernameRequired } from '../../../../../../constants/errors/db';

const USER_TYPE = 'User';

const loginViaEmailInputValidation = (input) => {
  const { email, username } = input;
  if (!username && !email) {
    throw new EitherUsernameEmailOrPhoneRequiredError();
  }
  // check email
  if (!username && !isValidEmail(email)) {
    throw new InvalidEmailError();
  }
  return true;
};

/*
- if the role is parent then send kids info with their tokens
*/
const loginViaPasswordMutationResolver = async (
  root,
  params,
  context,
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
    'ParentChildToken',
    ast,
    SINGULAR,
    fieldsFetched,
    authentication,
    {},
  );

  const currentUser = authentication && authentication.user;

  if (currentUser) {
    throw new UserTokenNotRequiredError();
  }
  if (input.email) loginViaEmailInputValidation(input);

  Object.assign(authentication, {
    bypass: true,
  });

  if (!input.email && !input.username) {
    throw new EmailOrUsernameRequired();
  }

  const modelQueries = new QueryController(USER_TYPE, authentication);

  const userData = await getUserFromDBQuery(input, modelQueries);
  if (!userData || !userData.id) {
    throw new DatabaseRecordNotFoundError();
  }
  const { role, id: userId } = userData;

  const userTokenData = checkPasswordAndReturnUserWithToken(userData, input, authentication);
  // if user is a parent then get children tokens as well
  if (role === PARENT || role === MENTOR) {
    userTokenData.children = await getChildrenToken(context, userId, role);
  }

  return userTokenData;
};

export default loginViaPasswordMutationResolver;

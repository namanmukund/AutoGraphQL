import { UserTokenNotRequiredError, DatabaseRecordNotFoundError, UnauthorizedOperationError } from '../../../../../../constants/errors';
import { QueryController } from '../../../controllers';
import { getFieldsBeingFetched } from '../../../../utils';
import { validate } from '../../../validation';
import { sendEmailForSendForgotPasswordLink } from '../utils';
import { UPDATE } from '../../../../../../constants/graphqlOperations';
import createToken from '../../../../../auth/createToken';
import { forgotPassWebURL } from '../../../../../../constants';

const nodeEnv = process.env.NODE_ENV || 'development';

const sendForgotPasswordLinkMutationPromise = (input, modelQueries) => modelQueries.fetchOne(input);

export default function sendForgotPasswordLinkMutationResolver(
  root,
  params,
  typeName,
  info,
  mutationName,
  ast,
  authentication,
) {
  const { fieldNodes } = info;
  const fieldsFetched = getFieldsBeingFetched(fieldNodes);
  validate(
    typeName,
    ast,
    UPDATE,
    fieldsFetched,
    authentication,
    {},
  );
  const currentUser = authentication && authentication.user;
  if (currentUser) {
    throw new UserTokenNotRequiredError();
  }
  Object.assign(authentication, {
    user: true,
  });
  const modelQueries = new QueryController(typeName, authentication);
  const { email } = params;
  const searchObj = {
    email,
  };
  // fetching user from database on basis of email id
  return sendForgotPasswordLinkMutationPromise(
    searchObj,
    modelQueries,
  ).then((fetchedUser) => {
    if (!fetchedUser) {
      throw new DatabaseRecordNotFoundError();
    }
    const { status } = fetchedUser;
    if (status !== 'active') {
      throw new UnauthorizedOperationError();
    }

    const token = createToken(fetchedUser, authentication, false, true);
    const forgotPassLink = forgotPassWebURL[nodeEnv] + token;
    // Send email to user with forgot password link
    sendEmailForSendForgotPasswordLink(fetchedUser, authentication, forgotPassLink);

    return {
      result: true,
    };
  });
}

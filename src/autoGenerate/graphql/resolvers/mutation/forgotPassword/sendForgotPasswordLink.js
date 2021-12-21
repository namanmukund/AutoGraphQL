import { UserTokenNotRequiredError, DatabaseRecordNotFoundError, UnauthorizedOperationError } from '../../../../../../constants/errors';
import { QueryController, MutationController } from '../../../controllers';
import { getFieldsBeingFetched } from '../../../../utils';
import { validate } from '../../../validation';
import { sendEmailForSendForgotPasswordLink } from '../utils';
import { UPDATE } from '../../../../../../constants/graphqlOperations';
import { forgotPassWebURL } from '../../../../../../constants';
import getTokenForLoginLink from '../../utils/getTokenForLoginLink';

const nodeEnv = process.env.NODE_ENV || 'development';

const sendForgotPasswordLinkMutationPromise = (input, modelQueries) => modelQueries.fetchOne(input);

const updateForgotPasswordLinkStatus = (
  searchObj,
  updateObj,
  modelMutations,
) => modelMutations.updateOne(searchObj, updateObj);

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
    const modelMutations = new MutationController(typeName, authentication);
    return updateForgotPasswordLinkStatus(
      searchObj,
      {
        resetPasswordFromLink: true,
      },
      modelMutations,
    ).then((result) => {
      if (!result) {
        throw new DatabaseRecordNotFoundError();
      }
      const token = getTokenForLoginLink(fetchedUser, new Date(), 1);
      let forgotPassLink = `${forgotPassWebURL[nodeEnv]}?authToken=${token}`;
      if (process.env.DATA_MASKING) {
        // eslint-disable-next-line no-param-reassign
        forgotPassLink = `${forgotPassWebURL.preProd}?authToken=${token}`;
      }
      // Send email to user with forgot password link
      sendEmailForSendForgotPasswordLink(fetchedUser, authentication, forgotPassLink);

      return {
        result: true,
      };
    });
  });
}

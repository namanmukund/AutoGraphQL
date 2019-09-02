import bcrypt from 'bcrypt';
import base64 from 'base-64';
import { MutationController, QueryController } from '../../../controllers';
import { getFieldsBeingFetched } from '../../../../utils';
import {
  DatabaseRecordNotFoundError, UnauthorizedOperationError,
  UserTokenNotPresentError,
  WrongUserTokenError,
  UserTokenExpiredError,
} from '../../../../../../constants/errors';
import { validate } from '../../../validation';
import allAuthParams from '../../../../../../config/authParams';
import { UPDATE } from '../../../../../../constants/graphqlOperations';
import { verifyToken } from '../../../../../auth';

const application = process.env.APPLICATION || 'core';
const authParams = allAuthParams[application];
const finishForgotPasswordQueryPromise = (input, modelQueries) =>
  modelQueries.fetchOne(input);

const finishForgotPasswordMutationPromise = (searchObj, updateObj, modelMutations) =>
  modelMutations.updateOne(searchObj, updateObj);


export default function resetPasswordFromForgotPasswordLinkMutationResolver(
  root,
  params,
  typeName,
  info,
  mutationName,
  ast,
  authentication,
  context,
) {
  const { fieldNodes } = info;
  const { authorization: token } = context;
  let decodeAuth = '';
  try {
    decodeAuth = token && base64.decode(token);
  } catch (err) {
    // Decode fails. Do nothing.
  }
  const authorizationArray = decodeAuth && decodeAuth.split('::');
  // Decode authorization
  // Second token is for user token
  const userToken = authorizationArray && authorizationArray[1];

  if (!userToken) {
    throw new UserTokenNotPresentError();
  }

  const decoded = verifyToken(userToken, true);
  if (!decoded) {
    throw new UserTokenExpiredError();
  }
  const { id } = decoded.userInfo;
  if (!id) {
    throw new WrongUserTokenError();
  }
  const { newPassword } = params;
  const fieldsFetched = getFieldsBeingFetched(fieldNodes);
  validate(
    typeName,
    ast,
    UPDATE,
    fieldsFetched,
    authentication,
    {},
  );
  /* Setting user to true if not preset, as finish forgot password
  does not require user authentication.
  */
  Object.assign(authentication, {
    user: true,
  });

  const modelQueries = new QueryController(typeName, authentication);
  const searchObj = {
    id,
  };

  return finishForgotPasswordQueryPromise(
    searchObj,
    modelQueries,
  ).then((user) => {
    if (!user) {
      throw new DatabaseRecordNotFoundError();
    }
    const { status } = user;
    if (status !== 'active') {
      throw new UnauthorizedOperationError();
    }
    const modelMutations = new MutationController(typeName, authentication);
    const hashedNewPwd = bcrypt.hashSync(newPassword, authParams.SALT);
    const updateObj = {
      password: hashedNewPwd,
      isSetPassword: true,
      emailVerified: true,
    };
    return finishForgotPasswordMutationPromise(
      searchObj,
      updateObj,
      modelMutations,
    ).then((res) => {
      if (!res) {
        throw new DatabaseRecordNotFoundError();
      }
      return {
        result: true,
      };
    });
  });
}

import { get } from 'lodash';
import jwt from 'jsonwebtoken';
import moment from 'moment';
import {
  DatabaseRecordNotFoundError,
  SomethingWentWrongError, ResetPasswordLinkExpired,
} from '../../../../../../constants/errors';
import { MissingMandatoryInputInRequestError } from '../../../../../../constants/errors/input';
import { MutationController, QueryController } from '../../../controllers';
import { getFieldsBeingFetched } from '../../../../utils';
import { validate } from '../../../validation';
import getUserPasswordObject from '../user/utils/getUserPasswordObject';
import { createUserTokenTypeData } from '../utils/createUserTokenTypeData';
import { SINGULAR } from '../../../../../../constants/graphqlOperations';
import coreAuthParams from '../../../../../../config/authParams';
import { LinkExpiredError, PasswordMismatchMessageError } from '../../../../../../constants/errors/auth';

const linkTokenSecret = coreAuthParams.LINK_TOKEN_SECRET;

const findUserMutationPromise = (input, modelQueries) => modelQueries.fetchOne(input);

const resetPasswordAndLoginMutationPromise = (searchObj, updateObj, modelMutations) => modelMutations.updateOne(searchObj, updateObj);

export default async function resetPasswordAndLoginMutationResolver(
  root,
  params,
  typeName,
  info,
  mutationName,
  ast,
  authentication,
) {
  const { fieldNodes } = info;
  const { input } = params;
  const fieldsFetched = getFieldsBeingFetched(fieldNodes);
  validate(
    'UserToken',
    ast,
    SINGULAR,
    fieldsFetched,
    authentication,
    {},
  );

  /* Setting user to true if not preset, as reset user password does
   not require user authentication. */
  Object.assign(authentication, {
    user: true,
  });
  if (!get(input, 'password') || !get(input, 'confirmPassword')) {
    throw new MissingMandatoryInputInRequestError();
  }
  let searchUserObj;
  if (get(input, 'phone.countryCode') && get(input, 'phone.number')) {
    searchUserObj = {
      'phone.countryCode': get(input, 'phone.countryCode'),
      'phone.number': get(input, 'phone.number'),
    };
  } else if (get(input, 'email')) {
    searchUserObj = {
      email,
    };
  } else {
    // decoding user and expiry time from token received
    await jwt.verify(get(input, 'linkToken'), linkTokenSecret, async (error, values) => {
      if (error) {
        throw new SomethingWentWrongError();
      }
      const { expiresIn, userInfo: { id } } = get(values, 'linkData');
      // if link visit exceeds the limit
      if (moment().isAfter(moment(expiresIn))) {
        throw new LinkExpiredError();
      }
      searchUserObj = {
        id,
      };
    });
  }
  const modelQueries = new QueryController(typeName, authentication);
  return findUserMutationPromise(searchUserObj, modelQueries).then(async (fetchedUser) => {
    if (!fetchedUser) {
      throw new DatabaseRecordNotFoundError();
    }
    if (get(input, 'password') !== get(input, 'confirmPassword')) {
      throw new PasswordMismatchMessageError();
    }
    const { id, resetPasswordFromLink } = fetchedUser;
    const updateObj = getUserPasswordObject(get(input, 'password'), true);
    if (get(input, 'linkToken')) {
      if (!resetPasswordFromLink) {
        throw new ResetPasswordLinkExpired();
      }
      Object.assign(updateObj, {
        resetPasswordFromLink: false,
      });
    }
    const modelMutations = new MutationController(typeName, authentication);
    const searchObj = { id };
    return resetPasswordAndLoginMutationPromise(
      searchObj,
      updateObj,
      modelMutations,
    ).then(() => {
      const data = createUserTokenTypeData(fetchedUser, authentication);
      return data;
    })
      .catch((err) => err);
  });
}

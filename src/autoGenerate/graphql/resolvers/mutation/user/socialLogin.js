import { get } from 'lodash';
import {
  InvalidFacebookTokenError,
  InvalidGmailTokenError,
  UserTokenNotRequiredError,
} from '../../../../../../constants/errors';
import { getFieldsBeingFetched } from '../../../../utils';
import { validate } from '../../../validation';
import { SINGULAR } from '../../../../../../constants/graphqlOperations';
import callGraphqlApi from '../../../../../api/callGraphqlApi';
import { generateCuid } from '../../../../../../utils';
import { createUserTokenTypeData } from '../utils/createUserTokenTypeData';
import localSignUpMutationPromise from '../utils/localSignUpMutationPromise';
import { MutationController } from '../../../controllers';
import Facebook from './Facebook';

const CLIENT_ID = '948144838611-najsguugb41q0ugs18tt9joous9kbqdg.apps.googleusercontent.com';
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(CLIENT_ID);

const getFieldStrings = (fieldsFetched) => {
  let fields = '';
  Object.keys(fieldsFetched).forEach((field) => {
    if (field !== 'token') {
      fields += `${field} `;
    }
  });
  return fields;
};
const verifyGmailAuthAndReturnUser = async (idToken) => {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: CLIENT_ID,
    });
    return ticket.getPayload();
  } catch (e) {
    throw new InvalidGmailTokenError();
  }
};

const generateUserInfoFromGmailResponse = (payload) => {
  const {
    name,
    email,
    email_verified: emailVerified,
    azp,
    aud,
    sub,
    locale,
    picture,
  } = payload;
  const userInfo = {
    name,
    email,
    username: email.split('@')[0],
    emailVerified,
    gmailAzp: azp,
    gmailAud: aud,
    gmailSub: sub,
    gmailLocale: locale,
    socialProfilePic: picture,
    isGmailLogin: true,
    status: 'active',
  };
  return userInfo;
};

const generateUserInfoFromFacebookResponse = (payload) => {
  const {
    id: facebookId,
    name,
    email,
    picture,
  } = payload;

  const userInfo = {
    facebookId,
    name,
    email: email || (`${facebookId}@autogenerate.com`),
    username: email ? email.split('@')[0] : facebookId,
    emailVerified: !!email,
    status: 'active',
    socialProfilePic: get(picture, 'data.url', ''),
    isFacebookLogin: true,
  };
  return userInfo;
};

const getUserData = async (email, fields) => {
  const query = `query{
  users(filter:{
    email:"${email}"
  }){
  ${fields}
  }
}`;
  const res = await callGraphqlApi(query);
  return get(res, 'data.users[0]');
};

const socialLoginMutationResolver = async (
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
    SINGULAR,
    fieldsFetched,
    authentication,
    input,
  );
  const decodedUser = authentication && authentication.user;
  if (decodedUser) {
    throw new UserTokenNotRequiredError();
  }
  Object.assign(authentication, {
    user: true,
  });

  const { userToken, type } = input;
  let payload;
  let schemaPayload;

  switch (type) {
    case 'gmail': {
      payload = await verifyGmailAuthAndReturnUser(userToken);
      schemaPayload = generateUserInfoFromGmailResponse(payload);
      break;
    }
    case 'facebook': {
      // get short-term access token
      const facebook = new Facebook();
      const fields = 'id, email, name, picture';
      try {
        payload = await facebook.call('me', { access_token: userToken, fields });
      } catch (e) {
        throw new InvalidFacebookTokenError();
      }
      schemaPayload = generateUserInfoFromFacebookResponse(payload);
      break;
    }
    default:
  }
  const { email } = schemaPayload;
  const fields = getFieldStrings(fieldsFetched);
  const userData = await getUserData(email, fields);
  // if user does not exist then add user
  let result = userData;
  if (!userData) {
    const cuidInput = generateCuid(schemaPayload);
    const modelMutations = new MutationController('User', { bypass: true });
    result = await localSignUpMutationPromise(cuidInput, modelMutations);
  }

  const userWithToken = createUserTokenTypeData(result);
  return userWithToken;
};

export default socialLoginMutationResolver;


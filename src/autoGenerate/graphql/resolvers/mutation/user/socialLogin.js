import { get } from 'lodash';
import {
  InvalidFacebookTokenError,
  InvalidGmailTokenError, UnauthenticatedAppError,
  UserTokenNotRequiredError,
} from '../../../../../../constants/errors';
import { getFieldsBeingFetched } from '../../../../utils';
import { validate } from '../../../validation';
import { SINGULAR } from '../../../../../../constants/graphqlOperations';
import { generateCuid } from '../../../../../../utils';
import { createUserTokenTypeData } from '../utils/createUserTokenTypeData';
import localSignUpMutationPromise from '../utils/localSignUpMutationPromise';
import { MutationController } from '../../../controllers';
import Facebook from './Facebook';
import getUserData from './utils/getUserData';

const CLIENT_ID = '948144838611-najsguugb41q0ugs18tt9joous9kbqdg.apps.googleusercontent.com';
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(CLIENT_ID);


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
    emailVerified: !!email,
    status: 'active',
    socialProfilePic: get(picture, 'data.url', ''),
    isFacebookLogin: true,
  };
  return userInfo;
};

const getNewDataFromSocialLogin = (
  userData,
  schemaPayload,
) => {
  const newItems = {};
  Object.keys(schemaPayload).forEach((field) => {
    if (!get(userData, `${field}`)) {
      newItems[field] = schemaPayload[field];
    }
  });
  return newItems;
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
  const decodedApp = authentication && authentication.app;

  if (!decodedApp) {
    throw new UnauthenticatedAppError();
  }
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
      const facebook = new Facebook();
      const fields = 'id, email, name, picture';
      try {
        payload = await facebook.call('me', { access_token: userToken, fields });
        schemaPayload = generateUserInfoFromFacebookResponse(payload);
      } catch (e) {
        throw new InvalidFacebookTokenError();
      }
      break;
    }
    default:
  }
  const { email } = schemaPayload;
  const userData = await getUserData(email, { bypass: true });
  // if user does not exist then add user
  let result = userData;
  const modelMutations = new MutationController('User', { bypass: true });
  if (!userData) {
    const cuidInput = generateCuid(schemaPayload);
    result = await localSignUpMutationPromise(cuidInput, modelMutations);
  } else {
    const updateObj = getNewDataFromSocialLogin(userData, schemaPayload);
    // if new data comes from social login then update that data with user
    if (Object.keys(updateObj)) {
      const { id } = userData;
      result = await modelMutations.updateDocument(id, updateObj);
    }
  }
  // return user with token info
  return createUserTokenTypeData(result);
};

export default socialLoginMutationResolver;

import base64 from 'base-64';
import { get } from 'lodash';
import { verifyToken, verifyAppToken } from '../auth';
import { QueryController, CacheController } from '../autoGenerate/graphql/controllers';
import { toObject, log } from '../../utils';
import { STATIC } from '../../constants';
import { DatabaseRecordNotFoundError } from '../../constants/errors';
import appSpecificAuthTokens from '../../constants/appSpecificAuthTokens';
import APM from '../APM';

const application = process.env.APPLICATION || 'core';
const CACHE_EXPIRY_IN_SECONDS = 3600;

const fetchUser = (id) => {
  const typeName = 'User';
  const newAuthentication = {
    bypass: true,
  };
  const modelQueries = new QueryController(typeName, newAuthentication);

  const userData = modelQueries.fetchOne({ id })
    .then((result) => {
      if (!result) {
        throw new DatabaseRecordNotFoundError();
      }
      return toObject(result);
    });
  return userData;
};

// Function to verify if static token is valid or not
const verifyIfStaticTokenIsValidOrNot = async (appToken) => {
  const typeName = 'AppToken';
  const newAuthentication = {
    bypass: true,
  };
  const cacheClient = new CacheController(newAuthentication);
  const cachedAppTokenRes = await cacheClient.get(`appToken::cache::${appToken}`);
  if (cachedAppTokenRes) {
    return true;
  }
  const modelQueries = new QueryController(typeName, newAuthentication);
  return modelQueries.fetchOne({ token: appToken })
    .then((result) => {
      cacheClient.set(result, {
        hkey: `appToken::cache::${appToken}`,
        maxAge: CACHE_EXPIRY_IN_SECONDS * 100,
      });
      if (!result) {
        return false;
      }
      return true;
    });
};

// Validate if token is blackListed or not
const validateForBlackListedToken = (encodedToken) => {
  // eslint-disable-next-line no-unreachable
  const typeName = 'BlacklistedToken';
  const newAuthentication = {
    bypass: true,
  };
  const modelQueries = new QueryController(typeName, newAuthentication);
  return modelQueries.fetchOne({ encodedToken })
    .then((result) => {
      // if result exists then the token is a blacklistedToken; hence return false in that case
      if (result && result.encodedToken) {
        return false;
      }
      return true;
    });
};

// Handle user token ans extract its information to req.currentUser and req.currentApp
const handleUserToken = async (id, currentApp, currentUser) => {
  const userInfo = {};
  // Get user by id
  const cacheClient = new CacheController({
    bypass: true,
  });
  let user = {};
  const cachedUserRes = await cacheClient.get(`user::cache::${id}`);
  if (cachedUserRes && get(cachedUserRes, 'id')) {
    user = cachedUserRes;
  } else {
    user = await fetchUser(id);
    cacheClient.set(user, {
      hkey: `user::cache::${id}`,
      maxAge: CACHE_EXPIRY_IN_SECONDS,
    });
  }
  // Get status
  let { status } = user;
  const { role, name, roles } = user;
  // Check if user token have phone login or email login information and update status accordingly
  if (typeof currentUser === 'object' && status === 'active') {
    // commenting emailVerified true logic as unverified email user can be active too
    const { phoneVerified } = user;
    if (currentUser.byPhone === true && !phoneVerified) {
      status = 'inactive';
    }
    // else if (currentUser.byEmail === true && !emailVerified) {
    //   status = 'inactive';
    // }
  }
  // Put status info in userInfo object
  userInfo.status = status;
  if (role && role.length) {
    userInfo.role = role;
  }
  if (name) {
    userInfo.name = name;
  }
  if (roles && roles.length) {
    userInfo.roles = roles;
  }
  return userInfo;
};

const extractAndUpdateUserTokenInfoInRequest = async (req, token, currentData) => {
  try {
    const decoded = verifyToken(token);
    if (decoded) {
      req[currentData] = decoded.userInfo;
      const { id } = decoded.userInfo;
      if (id) {
        const userObj = await handleUserToken(id, req.currentApp, req[currentData]);
        req[currentData] = {
          ...req[currentData],
          ...userObj,
        };
      }
    }
  } catch (err) {
    log(`Error processing ${currentData} token in middleware. Wrong user token is being used.`);
    log(err);
  }
  return null;
};

// Authorization middleware
const authMiddleware = async (req, res, next) => {
  if (!req.headers) {
    req.headers = {};
  }
  // authorization header set is base64 encoded by adding
  // app token and user token, separated by ::
  const { authorization } = req.headers;
  const isValidToken = true;
  // this is to ensure that only allowed tokens are permitted further
  if (authorization) {
    // isValidToken = await validateForBlackListedToken(authorization);
    req.authorization = authorization;
  }
  let decodeAuth = '';
  try {
    decodeAuth = authorization && base64.decode(authorization);
  } catch (err) {
    // Decode fails. Do nothing.
  }
  // if mutation call route header, set it in req
  if (req.headers['mutation-call-route']) {
    req.mutationCallRoute = req.headers['mutation-call-route'];
  }
  const authorizationArray = decodeAuth && decodeAuth.split('::');
  // Decode authorization
  // First token is for app token
  const appToken = authorizationArray && authorizationArray[0];
  // Second token is for user token
  const userToken = authorizationArray && authorizationArray[1];
  // Verify App
  const isUserTokenValid = await validateForBlackListedToken(userToken, true);
  if (appToken && isValidToken) {
    try {
      const decoded = verifyAppToken(appToken, application);
      if (decoded) {
        // if token is static type validate if token is present in the database or not
        const { name, type } = decoded.appInfo;
        let isValidStaticToken = false;
        if (type && type === STATIC) {
          isValidStaticToken = await verifyIfStaticTokenIsValidOrNot(appToken);
          decoded.appInfo.isValidStaticToken = isValidStaticToken;
        }
        req.currentApp = decoded.appInfo;
        if (appSpecificAuthTokens[name] && authorizationArray && authorizationArray[2]) {
          await extractAndUpdateUserTokenInfoInRequest(
            req,
            authorizationArray[2],
            appSpecificAuthTokens[name],
          );
        }
      }
    } catch (err) {
      log('Error processing app token in middleware. Wrong app token is being used.');
      log(err);
    }
  }
  // Verify User
  if (userToken && isValidToken && isUserTokenValid) {
    await extractAndUpdateUserTokenInfoInRequest(req, userToken, 'currentUser');
  }
  // Set user info in APM (Sentry)
  APM.setUser(req.currentUser);
  next();
};

export { authMiddleware, verifyIfStaticTokenIsValidOrNot, handleUserToken };

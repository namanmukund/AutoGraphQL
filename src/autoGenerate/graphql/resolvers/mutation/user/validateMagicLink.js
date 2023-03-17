/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
import { get } from 'lodash';
import jwt from 'jsonwebtoken';
import moment from 'moment';
import {
  DatabaseRecordNotFoundError,
  SomethingWentWrongError,
  UserTokenNotRequiredError, InvalidToken,
} from '../../../../../../constants/errors';
import { QueryController } from '../../../controllers';
import { getUserFromDBQuery } from './utils';
import { PARENT, MENTOR } from '../../../../../../constants/roles';
import getChildrenToken from './utils/getChildrenToken';
import { createUserTokenTypeData } from '../utils/createUserTokenTypeData';
import { LinkExpiredError } from '../../../../../../constants/errors/auth';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import coreAuthParams from '../../../../../../config/authParams';
import { MissingMandatoryInputInRequestError } from '../../../../../../constants/errors/input';

const linkTokenSecret = coreAuthParams.LINK_TOKEN_SECRET;

const getuserInfo = async (userId) => {
  const query = `{
  user(id: "${userId}") {
    id
    studentProfile {
      id
      parents {
        id
        user {
          id
        }
      }
    }
  }
}`;
  const userData = await callLocalGraphqlApi(query);
  return get(userData, 'data.user');
};

const getTokenDetails = async (linkToken, userId) => {
  const query = `{
  magicLinkLogs(
    filter: { and: [{ linkToken: "${linkToken}" }, { user_some: { id: "${userId}" } }] }
  ) {
    id
    linkToken
    expiresIn
    isLinkVisited
    visitedCount
    linkVisitLimit
  }
}`;
  const result = await callLocalGraphqlApi(query);
  return get(result, 'data.magicLinkLogs', []);
};

const updateTokenDetail = async (tokenLogId, isLinkVisited, visitedCount = 0) => {
  const query = `mutation {
  updateMagicLinkLog(id: "${tokenLogId}", input: {
    ${!isLinkVisited ? 'isLinkVisited: true' : ''},
    ${!isLinkVisited ? `firstLinkVisitedDate: "${new Date()}"` : ''}
     visitedCount: ${visitedCount + 1} }) {
    id
  }
}`;
  const result = await callLocalGraphqlApi(query);
  return get(result, 'data.updateMagicLinkLog');
};

const USER_TYPE = 'User';

const validateMagicLinkMutationResolver = async (
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
  const currentUser = authentication && authentication.user;

  if (currentUser) {
    throw new UserTokenNotRequiredError();
  }
  const { linkToken } = input;
  if (!linkToken) {
    throw new MissingMandatoryInputInRequestError();
  }
  let isBuddyLogin = false;
  const buddyLoginInput = [];
  // decoding user and expiry time from token received
  await jwt.verify(linkToken, linkTokenSecret, async (error, values) => {
    if (error) {
      if (error.name && error.name === 'TokenExpiredError') {
        throw new LinkExpiredError();
      }
      throw new SomethingWentWrongError();
    }
    const { expiresIn, usersInfo } = get(values, 'linkData');
    const id = (usersInfo && usersInfo.length > 1) ? get(usersInfo, '[0].id') : get(usersInfo, 'id');
    if (usersInfo && Array.isArray(usersInfo) && usersInfo.length > 1) {
      isBuddyLogin = true;
    }
    // getting link details from logs
    const magicLinkDetails = await getTokenDetails(linkToken, id);
    if (!magicLinkDetails.length) {
      throw new InvalidToken();
    }
    const {
      id: tokenLogId, isLinkVisited = false, visitedCount, linkVisitLimit,
    } = get(magicLinkDetails, '[0]');
    updateTokenDetail(tokenLogId, isLinkVisited, visitedCount);
    // if link visit exceeds the limit
    if (visitedCount >= linkVisitLimit) {
      throw new LinkExpiredError();
    }
    if (moment().isAfter(moment(expiresIn))) {
      throw new LinkExpiredError();
    }
    if (isBuddyLogin) {
      usersInfo.forEach((buddy, index) => {
        let isPrimaryUser = false;
        if (index === 0) {
          isPrimaryUser = true;
        }
        buddyLoginInput.push({ userId: get(buddy, 'id'), isPrimaryUser });
      });
    }
    if (!isBuddyLogin) {
      const userInformation = await getuserInfo(id);
      const parentInfo = get(userInformation, 'studentProfile.parents[0].user');
      if (get(parentInfo, 'id')) {
        input.id = get(parentInfo, 'id');
      } else input.id = id;
    }
  });
  Object.assign(authentication, {
    bypass: true,
  });
  const modelQueries = new QueryController(USER_TYPE, authentication);
  if (isBuddyLogin && buddyLoginInput.length) {
    let userTokenData = { buddyDetails: [] };
    for (const user of buddyLoginInput) {
      const userData = await getUserFromDBQuery({ id: get(user, 'userId') }, modelQueries);
      const userDetail = createUserTokenTypeData(userData, authentication);
      if (get(user, 'isPrimaryUser')) {
        userTokenData.buddyDetails.push({ ...userDetail, isPrimaryUser: true });
        userTokenData = { ...userTokenData, ...userDetail };
      } else {
        userTokenData.buddyDetails.push({ ...userDetail, isPrimaryUser: false });
      }
    }
    return userTokenData;
  }

  const userData = await getUserFromDBQuery(input, modelQueries);
  if (!userData || !userData.id) {
    throw new DatabaseRecordNotFoundError();
  }

  const {
    id,
    role,
  } = userData;

  const userTokenData = createUserTokenTypeData(userData, authentication);
  // if user is a parent then get children tokens as well
  if (role === PARENT || role === MENTOR) {
    userTokenData.children = await getChildrenToken(context, id, role);
  }
  return userTokenData;
};

export default validateMagicLinkMutationResolver;

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
import { PARENT } from '../../../../../../constants/roles';
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
          email
          emailOtp
          phone {
            number
            countryCode
          }
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
  // decoding user and expiry time from token received
  await jwt.verify(linkToken, linkTokenSecret, async (error, values) => {
    if (error) {
      throw new SomethingWentWrongError();
    }
    const { expiresIn, userInfo: { id } } = get(values, 'linkData');
    // getting link details from logs
    const magicLinkDetails = await getTokenDetails(linkToken, id);
    if (!magicLinkDetails.length) {
      throw new InvalidToken();
    }
    const { id: tokenLogId, isLinkVisited = false, visitedCount } = get(magicLinkDetails, '[0]');
    updateTokenDetail(tokenLogId, isLinkVisited, visitedCount);
    // if link is already visited
    if (isLinkVisited) {
      throw new LinkExpiredError();
    }
    if (moment().isAfter(moment(expiresIn))) {
      throw new LinkExpiredError();
    }
    const userInfo = await getuserInfo(id);
    const userPhone = get(userInfo, 'studentProfile.parents[0].user.phone');
    if (get(userPhone, 'number')) {
      input.phone = userPhone;
    } else if (get(userInfo, 'studentProfile.parents[0].user.email')) {
      input.email = get(userInfo, 'studentProfile.parents[0].user.email');
    }
  });

  Object.assign(authentication, {
    bypass: true,
  });
  const modelQueries = new QueryController(USER_TYPE, authentication);
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
  if (role === PARENT) {
    userTokenData.children = await getChildrenToken(context, id);
  }
  return userTokenData;
};

export default validateMagicLinkMutationResolver;

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

const getTokenDetails = async (linkToken, userToken) => {
  const query = `{
  magicLinkLogs(filter: { and: [{ expiryToken: "${linkToken}" }, { userToken: "${userToken}" }] }) {
    id
    userToken
    expiresIn
    expiryToken
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
  const { userToken, linkToken } = input;
  if (linkToken && userToken) {
    const magicLinkDetails = await getTokenDetails(linkToken, userToken);
    if (magicLinkDetails.length > 0) {
      const { id: tokenLogId, isLinkVisited = false, visitedCount } = get(magicLinkDetails, '[0]');
      updateTokenDetail(tokenLogId, isLinkVisited, visitedCount);
      if (!isLinkVisited) {
        const linkTokenSecret = coreAuthParams.LINK_TOKEN_SECRET;
        await jwt.verify(linkToken, linkTokenSecret, async (err, decodedValue) => {
          if (err) {
            throw new SomethingWentWrongError();
          }
          const expiresIn = get(decodedValue, 'expiryData.expiresIn');
          if (moment().isAfter(moment(expiresIn))) {
            throw new LinkExpiredError();
          } else {
            await jwt.verify(userToken, userTokenSecret, async (error, decodedData) => {
              if (error) {
                throw new SomethingWentWrongError();
              }
              const userId = get(decodedData, 'userInfo.id');
              const userInfo = await getuserInfo(userId);
              const userPhone = get(userInfo, 'studentProfile.parents[0].user.phone');
              if (get(userPhone, 'number')) {
                input.phone = userPhone;
              } else if (get(userInfo, 'studentProfile.parents[0].user.email')) {
                input.email = get(userInfo, 'studentProfile.parents[0].user.email');
              }
            });
          }
        });
      } else {
        throw new LinkExpiredError();
      }
    } else {
      throw new InvalidToken();
    }
  } else {
    throw new InvalidToken();
  }

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

import { get } from 'lodash';
import jwt from 'jsonwebtoken';
import moment from 'moment';
import {
  DatabaseRecordNotFoundError,
  OTPMismatchError, SendOtpFirstError,
  SomethingWentWrongError,
  UserTokenNotRequiredError, InvalidToken,
} from '../../../../../../constants/errors';
import { QueryController, MutationController } from '../../../controllers';
import { getFieldsBeingFetched } from '../../../../utils';
import { validate } from '../../../validation';
import { SINGULAR } from '../../../../../../constants/graphqlOperations';
import loginViaOtpInputValidation from './utils/loginViaOtpInputValidation';
import { getUserFromDBQuery } from './utils';
import authParams from '../../../../../../config/authParams';
import { PARENT } from '../../../../../../constants/roles';
import getChildrenToken from './utils/getChildrenToken';
import { createUserTokenTypeData } from '../utils/createUserTokenTypeData';
import getTimeDifferenceWithCurrentDateInSeconds
  from '../../../../../../utils/getTimeDifferenceWithCurrentDateInSeconds';
import updateLeadSquared from '../../../../../../services/leadsquared/updateLeadSquared';
import { LinkExpiredError } from '../../../../../../constants/errors/auth';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import { MASTER_OTP } from '../../../../../../constants';

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
    isActive
    visitedCount
  }
}`;
  const result = await callLocalGraphqlApi(query);
  return get(result, 'data.magicLinkLogs', []);
};

const updateTokenDetail = async (tokenLogId, isActive, visitedCount = 0) => {
  const query = `mutation {
  updateMagicLinkLog(id: "${tokenLogId}", input: { ${isActive ? 'isActive: false' : ''}, visitedCount: ${visitedCount + 1} }) {
    id
  }
}`;
  const result = await callLocalGraphqlApi(query);
  return get(result, 'data.updateMagicLinkLog');
};

const USER_TYPE = 'User';
const validateUserOTPMutationPromise = (
  searchObj,
  updateObj,
  modelMutations,
) => modelMutations.updateOne(searchObj, updateObj);

const validateUserOTPMutationResolver = async (
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
  const userToken = get(input, 'userToken');
  const linkToken = get(input, 'linkToken');
  let loginViaEmail = false;
  if (linkToken && userToken) {
    const magicLinkDetails = await getTokenDetails(linkToken, userToken);
    if (magicLinkDetails.length > 0) {
      const { id: tokenLogId, isActive = false, visitedCount } = get(magicLinkDetails, '[0]');
      updateTokenDetail(tokenLogId, isActive, visitedCount);
      if (isActive) {
        const secret = process.env.SECRET;
        await jwt.verify(linkToken, secret, async (err, decodedValue) => {
          if (err) {
            throw new SomethingWentWrongError();
          }
          const expiresIn = get(decodedValue, 'expiryData.expiresIn');
          if (moment().isAfter(moment(expiresIn))) {
            throw new LinkExpiredError();
          } else {
            await jwt.verify(userToken, secret, async (error, decodedData) => {
              if (error) {
                throw new SomethingWentWrongError();
              }
              const userId = get(decodedData, 'userInfo.id');
              const userInfo = await getuserInfo(userId);
              const userPhone = get(userInfo, 'studentProfile.parents[0].user.phone');
              if (get(userPhone, 'number')) {
                input.phone = userPhone;
                input.phoneOtp = MASTER_OTP;
              } else if (get(userInfo, 'studentProfile.parents[0].user.email')) {
                input.email = get(userInfo, 'studentProfile.parents[0].user.email');
                loginViaEmail = true;
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
  }
  const { fieldNodes } = info;
  const fieldsFetched = getFieldsBeingFetched(fieldNodes);

  validate(
    typeName,
    ast,
    SINGULAR,
    fieldsFetched,
    authentication,
  );

  const currentUser = authentication && authentication.user;

  if (currentUser) {
    throw new UserTokenNotRequiredError();
  }
  loginViaOtpInputValidation(input);

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
    phoneOtpCreationDate,
    role,
    phoneVerified,
    emailVerified,
    status,
  } = userData;

  const {
    phoneOtp,
    emailOtp,
    phone,
  } = input;

  let updateObj;
  let result;
  if (!(process.env.NODE_ENV && process.env.NODE_ENV === 'staging')) {
    if (phoneOtp) {
    // temporary code
      const countryCode = get(phone, 'countryCode', '');
      const number = get(phone, 'number', '');
      const phoneNumber = countryCode + number;
      const businessPartnerDemoNumber = '+918827706789';

      if (!(phoneOtp === MASTER_OTP || (phoneOtp === 7777 && phoneNumber === businessPartnerDemoNumber))) {
        if (userData.phoneOtp !== phoneOtp) {
          throw new OTPMismatchError();
        }
        if (
          getTimeDifferenceWithCurrentDateInSeconds(phoneOtpCreationDate)
        > authParams.OTP_EXPIRATION_TIME_IN_SEC) {
          throw new Error('Otp expired');
        }
      }

      updateObj = {
        phoneVerified: true,
        status: 'active',
      };
      if (!phoneVerified) {
        updateLeadSquared({
          Phone: number,
          mx_OTP_Verified: 'Yes',
        }, false);
      }
    } else if (emailOtp) {
      if (userData.emailOtp !== emailOtp) {
        throw new OTPMismatchError();
      }
      updateObj = {
        emailVerified: true,
        status: 'active',
      };
    } else if (!loginViaEmail) {
      throw new SendOtpFirstError();
    }
  }
  // if user is already verifiedj
  if (
    (phoneOtp && phoneVerified && status === 'active')
    || (emailOtp && emailVerified && status === 'active')
  ) {
    result = userData;
  } else {
    const modelMutations = new MutationController(typeName, authentication);
    result = await validateUserOTPMutationPromise({ id }, updateObj, modelMutations);
  }

  const userTokenData = createUserTokenTypeData(result, authentication);
  // if user is a parent then get children tokens as well
  if (role === PARENT) {
    userTokenData.children = await getChildrenToken(context, id);
  }
  return userTokenData;
};

export default validateUserOTPMutationResolver;

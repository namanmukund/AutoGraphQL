import { get } from 'lodash';
import { getFieldsBeingFetched } from '../../../../utils';
import { validate, validateName } from '../../../validation';
import { SINGULAR } from '../../../../../../constants/graphqlOperations';
import {
  BlockedOperationError,
  DatabaseRecordNotFoundError,
  UserTokenNotRequiredError,
} from '../../../../../../constants/errors';
import { MutationController, QueryController } from '../../../controllers';
import { getUserFromDBQuery } from './utils';
import { generateCuid, getRandomNumber } from '../../../../../../utils';
import { BLOCKED, rangeOTP } from '../../../../../../constants';
import loginViaOtpInputValidation from './utils/loginViaOtpInputValidation';
import getNumberAndSendSms from '../../../../../sms/getNumberAndSendSms';
import { PARENT } from '../../../../../../constants/roles';
import parentChildSignupPostHookMethod from '../../../postHookFunctions/parentChildSignupPostHookMethod';
// import sendBookingReminderOrConfirmationB2BC from '../../../postHookFunctions/utils/sendBookingReminderOrConfirmationB2B2C';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const USER_TYPE = 'User';

const FETCH_CAMPAIGN = (campaignId) => `{
  campaign(id: "${campaignId}") {
    type
    batchRules {
      batchSize 
    }
    code
    school {
      name
    }
  }
}`;

const updateExistingUserOTP = (
  searchObj,
  updateObj,
  modelMutations,
) => modelMutations.updateOne(searchObj, updateObj);

/*
- if the role is parent then send kids info with their tokens
*/
const signupOrLoginViaOtp = async (
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
  const { fieldNodes } = info;
  const fieldsFetched = getFieldsBeingFetched(fieldNodes);
  validate(
    'BooleanResult',
    ast,
    SINGULAR,
    fieldsFetched,
    authentication,
    {},
  );

  if (input.name) {
    validateName(input.name);
  }

  const currentUser = authentication && authentication.user;
  if (currentUser) {
    throw new UserTokenNotRequiredError();
  }
  loginViaOtpInputValidation(input);

  Object.assign(authentication, {
    bypass: true,
  });

  const modelQueries = new QueryController(USER_TYPE, authentication);
  let userData = await getUserFromDBQuery(input, modelQueries);

  if (get(userData, 'status') === BLOCKED) {
    throw new BlockedOperationError();
  }

  if (!userData || !userData.id) {
    // create user if it doesn't exist and phone is passed in input else throw error
    if (input.phone) {
      const modelMutations = new MutationController(typeName, { bypass: true });
      let userRole = PARENT;
      if (input.role === 'schoolAdmin') {
        userRole = 'schoolAdmin';
      }
      const newUser = {
        phone: {
          number: input.phone.number,
          countryCode: input.phone.countryCode,
        },
        role: userRole,
      };
      if (input.campaignId) {
        newUser.campaign = {
          type: 'Campaign',
          typeId: input.campaignId,
        };
      }
      if (input.source) {
        newUser.source = input.source;
      }
      if (input.name) {
        newUser.name = input.name;
      }
      if (input.utmSource) {
        newUser.utmSource = input.utmSource;
      }
      if (input.utmCampaign) {
        newUser.utmCampaign = input.utmCampaign;
      }
      if (input.utmTerm) {
        newUser.utmTerm = input.utmTerm;
      }
      if (input.utmContent) {
        newUser.utmContent = input.utmContent;
      }
      if (input.utmMedium) {
        newUser.utmMedium = input.utmMedium;
      }
      newUser.country = input.country || 'india';
      newUser.timezone = input.timezone || 'Asia/Kolkata';
      input.country = input.country ? input.country : 'india';
      input.leadStatus = 'New Lead';
      input.unVerifiedLead = true;
      // fetch campaign type early to modfiy newUser obj with vertical
      let campaignRes = null;
      let campaignType = null;
      if (input.campaignId) {
        campaignRes = await callLocalGraphqlApi(FETCH_CAMPAIGN(input.campaignId));
        campaignType = get(campaignRes, 'data.campaign.type', '');
      }
      if (campaignType && campaignType === 'b2b') {
        newUser.vertical = 'b2b';
      } else if (campaignType) {
        newUser.vertical = 'b2b2c';
      }
      userData = generateCuid(newUser);
      await modelMutations.addDocument(userData);
      // sendBookingReminderOrConfirmationB2BC(userData.id);
      // create on leadsquared
      if (input.campaignId) {
        input.schoolName = get(campaignRes, 'data.campaign.school.name', '');
        input.Vertical = campaignType.replace('Event', '');
        input.campaignCode = get(campaignRes, 'data.campaign.code');
        input.mx_Demo_Model = `1:${get(campaignRes, 'data.campaign.batchRules.batchSize', '')}`;
        parentChildSignupPostHookMethod(input, params);
      } else {
        parentChildSignupPostHookMethod(input, params);
      }
    } else {
      throw new DatabaseRecordNotFoundError();
    }
  }
  const phoneOtp = getRandomNumber(rangeOTP.min, rangeOTP.max);
  const modelMutations = new MutationController(typeName, authentication);
  const updateObj = {
    phoneOtp,
    phoneOtpCreationDate: new Date(),
  };
  // update phoneOtp in db
  await updateExistingUserOTP({ id: userData.id }, updateObj, modelMutations);

  // send otp to the client
  const { name, phone } = userData;
  if (!input.email) {
    getNumberAndSendSms(phone, phoneOtp, name);
  }
  return {
    result: true,
  };
};

export default signupOrLoginViaOtp;

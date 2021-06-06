import { get } from 'lodash';
import { getFieldsBeingFetched } from '../../../../utils';
import { validate } from '../../../validation';
import { SINGULAR } from '../../../../../../constants/graphqlOperations';
import {
  DatabaseRecordNotFoundError,
  UserTokenNotRequiredError,
} from '../../../../../../constants/errors';
import { MutationController, QueryController } from '../../../controllers';
import { getUserFromDBQuery } from './utils';
import { generateCuid, getRandomNumber } from '../../../../../../utils';
import { rangeOTP } from '../../../../../../constants';
import loginViaOtpInputValidation from './utils/loginViaOtpInputValidation';
import getNumberAndSendSms from '../../../../../sms/getNumberAndSendSms';
import { PARENT } from '../../../../../../constants/roles';
import parentChildSignupPostHookMethod from '../../../postHookFunctions/parentChildSignupPostHookMethod';
import sendBookingReminderOrConfirmationB2BC from '../../../postHookFunctions/utils/sendBookingReminderOrConfirmationB2B2C';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const USER_TYPE = 'User';

const FETCH_CAMPAIGN = (campaignId) => `{
  campaign(id: "${campaignId}") {
    type
    batchRules {
      batchSize 
    }
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

  if (!userData || !userData.id) {
    // create user if it doesn't exist and phone is passed in input else throw error
    if (input.phone) {
      const modelMutations = new MutationController(typeName, { bypass: true });
      const newUser = {
        phone: {
          number: input.phone.number,
          countryCode: input.phone.countryCode,
        },
        role: PARENT,
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
      userData = generateCuid(newUser);
      input.leadStatus = 'New Lead';
      input.country = input.country ? input.country : 'india';

      await modelMutations.addDocument(userData);
      sendBookingReminderOrConfirmationB2BC(userData.id);
      // create on leadsquared
      if (input.campaignId) {
        const campaignRes = await callLocalGraphqlApi(FETCH_CAMPAIGN(input.campaignId));
        const campaignType = get(campaignRes, 'data.campaign.type', '');
        input.schoolName = get(campaignRes, 'data.campaign.school.name', '');
        input.Vertical = campaignType.replace('Event', '');
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
  getNumberAndSendSms(phone, phoneOtp, name);
  return {
    result: true,
  };
};

export default signupOrLoginViaOtp;

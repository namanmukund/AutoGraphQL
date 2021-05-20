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

const USER_TYPE = 'User';

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
    const modelMutations = new MutationController(typeName, { bypass: true });
    const newUser = {
      phone: {
        number: input.phone.number,
        countryCode: input.phone.countryCode,
      },
      // campaign:
    };
    userData = generateCuid(newUser);
    await modelMutations.addDocument(userData);
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

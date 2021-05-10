import {
  UserTokenNotRequiredError,
  DatabaseRecordNotFoundError,
} from '../../../../../../constants/errors';
import { MutationController } from '../../../controllers';
import {
  createUserTokenTypeData,
} from '../utils/createUserTokenTypeData';
import { getFieldsBeingFetched } from '../../../../utils';
import { validate } from '../../../validation';
import { getNumberAndSendSms } from '../../../../../sms';
import { sendEmailOtpToUser } from '../../../../../email/messages';
import validateSignupExistingUserStatus from '../utils/validateSignupExistingUserStatus';
import { ADD } from '../../../../../../constants/graphqlOperations';

const updateExistingUserOTP = (
  searchObj,
  updateObj,
  modelMutations,
) => modelMutations.updateOne(searchObj, updateObj);

const existingUserOutput = async (
  savedUser,
  input,
  isPhone,
  authentication,
  stopOtpTrigger,
) => {
  if (!savedUser) {
    throw new DatabaseRecordNotFoundError();
  }

  const userData = createUserTokenTypeData(savedUser, authentication, isPhone);
  const { name } = userData;
  // if stopOtpTrigger is true then otp will not be sent else it will be sent
  if (!stopOtpTrigger) {
    if (isPhone) {
      getNumberAndSendSms(input, name);
    } else {
      const appName = authentication.app.name;
      const { email, emailOtp } = userData;
      sendEmailOtpToUser(email, emailOtp, appName);
    }
  }

  return userData;
};
export default function signupExistingUserMutationResolver(
  root,
  params,
  typeName,
  info,
  mutationName,
  ast,
  authentication,
) {
  const { input, stopOtpTrigger } = params;
  const { fieldNodes } = info;
  const fieldsFetched = getFieldsBeingFetched(fieldNodes);

  validate(
    typeName,
    ast,
    ADD,
    fieldsFetched,
    authentication,
    {},
  );

  const currentUser = authentication && authentication.user;
  if (currentUser) {
    throw new UserTokenNotRequiredError();
  }

  /* Setting user to true if not preset, as signupExistingUser
  does not require user authentication.
  */
  Object.assign(authentication, {
    user: true,
  });

  const {
    phone, phoneOtp, email, emailOtp,
  } = input;
  let searchObj;
  let updateObj;
  let isPhone = false;
  if (phone) {
    const { countryCode, number } = phone;
    searchObj = {
      'phone.countryCode': countryCode,
      'phone.number': number,
    };
    updateObj = {
      phoneOtp,
    };
    isPhone = true;
  } else {
    searchObj = { email };
    updateObj = {
      emailOtp,
    };
  }
  // check if the status is valid before updating or sending otp to user
  return validateSignupExistingUserStatus(
    searchObj,
    typeName,
    authentication,
    isPhone,
  ).then(() => {
    const modelMutations = new MutationController(typeName, authentication);
    return updateExistingUserOTP(
      searchObj,
      updateObj,
      modelMutations,
    ).then((savedUser) => existingUserOutput(
      savedUser,
      input,
      isPhone,
      authentication,
      stopOtpTrigger,
    ));
  });
}

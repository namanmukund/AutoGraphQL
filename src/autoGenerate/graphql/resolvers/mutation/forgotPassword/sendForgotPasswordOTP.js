import { UserTokenNotRequiredError, DatabaseRecordNotFoundError, UnauthorizedOperationError } from '../../../../../../constants/errors';
import { QueryController, MutationController } from '../../../controllers';
import { getFieldsBeingFetched } from '../../../../utils';
import { validate } from '../../../validation';
import { sendEmailSmsForSendResendForgotPasswordOTP } from '../utils';
import { UPDATE } from '../../../../../../constants/graphqlOperations';

const sendForgotPasswordOTPMutationPromise = (input, modelQueries) => modelQueries.fetchOne(input);

const updateUserOTP = (
  searchObj,
  updateObj,
  modelMutations,
) => modelMutations.updateOne(searchObj, updateObj);

export default function sendForgotPasswordOTPMutationResolver(
  root,
  params,
  typeName,
  info,
  mutationName,
  ast,
  authentication,
) {
  const { fieldNodes } = info;
  const fieldsFetched = getFieldsBeingFetched(fieldNodes);

  validate(
    typeName,
    ast,
    UPDATE,
    fieldsFetched,
    authentication,
    {},
  );

  const currentUser = authentication && authentication.user;
  if (currentUser) {
    throw new UserTokenNotRequiredError();
  }

  /* Setting user to true if not preset, as send forgot password
  does not require user authentication.
  */
  Object.assign(authentication, {
    user: true,
  });
  const modelQueries = new QueryController(typeName, authentication);
  const {
    phone, phoneOtp, isPhone, email, emailOtp,
  } = params;
  let searchObj;
  let updateObj;
  if (isPhone) {
    const { countryCode, number } = phone;
    searchObj = {
      'phone.countryCode': countryCode,
      'phone.number': number,
    };
    updateObj = {
      phoneOtp,
    };
  } else {
    searchObj = {
      email,
    };
    updateObj = {
      emailOtp,
    };
  }

  return sendForgotPasswordOTPMutationPromise(
    searchObj,
    modelQueries,
  ).then((fetchedUser) => {
    if (!fetchedUser) {
      throw new DatabaseRecordNotFoundError();
    }
    const { status } = fetchedUser;
    if (status !== 'active') {
      throw new UnauthorizedOperationError();
    }
    const modelMutations = new MutationController(typeName, authentication);
    return updateUserOTP(
      searchObj,
      updateObj,
      modelMutations,
    ).then((result) => {
      if (!result) {
        throw new DatabaseRecordNotFoundError();
      }
      // Send sms or email
      sendEmailSmsForSendResendForgotPasswordOTP(result, isPhone, authentication);

      return {
        result: true,
      };
    });
  });
}

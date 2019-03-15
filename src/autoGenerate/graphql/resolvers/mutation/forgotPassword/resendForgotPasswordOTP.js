import { operationName } from '../../../../../../constants';
import { UserTokenNotRequiredError,
  DatabaseRecordNotFoundError,
  UnauthorizedOperationError,
  MandatoryFieldNotSetError,
} from '../../../../../../constants/errors';
import { QueryController } from '../../../controllers';
import { getFieldsBeingFetched } from '../../../../utils';
import { validate } from '../../../validation';
import { getQueryForResendValidateAndFinishForgotPassword,
  sendEmailSmsForSendResendForgotPasswordOTP } from '../utils';

const resendForgotPasswordOTPQueryPromise = (input, modelQueries) =>
  modelQueries.fetchOne(input);

const validateUser = (fetchedUser, isPhone) => {
  if (!fetchedUser) {
    throw new DatabaseRecordNotFoundError();
  }
  const { status } = fetchedUser;
  if (status !== 'active') {
    throw new UnauthorizedOperationError();
  }
  let fieldName = '';
  if (isPhone) {
    if (!fetchedUser.phone) {
      fieldName = 'phone';
    }

    if (!fetchedUser.phoneOtp) {
      fieldName = 'phoneOtp';
    }
  } else {
    if (!fetchedUser.email) {
      fieldName = 'email';
    }

    if (!fetchedUser.emailOtp) {
      fieldName = 'emailOtp';
    }
  }
  if (fieldName) {
    throw new MandatoryFieldNotSetError({ data: { fieldName } });
  }
  return true;
};

export default function resendForgotPasswordOTPMutationResolver(
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
    operationName.update,
    fieldsFetched,
    authentication,
    {},
  );

  const decodedUser = authentication && authentication.user;
  if (decodedUser) {
    throw new UserTokenNotRequiredError();
  }
  /* Setting user to true if not preset, as resend forgot password
  does not require user authentication.
  */
  Object.assign(authentication, {
    user: true,
  });
  const modelQueries = new QueryController(typeName, authentication);
  const { isPhone } = params;
  const searchObj = getQueryForResendValidateAndFinishForgotPassword(params);

  return resendForgotPasswordOTPQueryPromise(
    searchObj,
    modelQueries,
  ).then((fetchedUser) => {
    // Validate user.
    validateUser(fetchedUser, isPhone);
    // Send sms or email
    sendEmailSmsForSendResendForgotPasswordOTP(fetchedUser, isPhone, authentication);

    return {
      result: true,
    };
  }).catch(err => err);
}


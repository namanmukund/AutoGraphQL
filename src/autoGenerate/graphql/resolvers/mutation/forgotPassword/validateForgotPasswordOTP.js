import {
  DatabaseRecordNotFoundError,
  OTPMismatchError, UserTokenNotRequiredError, UnauthorizedOperationError,
} from '../../../../../../constants/errors';
import { QueryController } from '../../../controllers';
import { getFieldsBeingFetched } from '../../../../utils';
import { validate } from '../../../validation';
import { getQueryForResendValidateAndFinishForgotPassword } from '../utils';
import { SINGULAR } from '../../../../../../constants/graphqlOperations';
import { MASTER_OTP } from '../../../../../../constants';

export default function validateForgotPasswordOTPMutationResolver(
  root,
  params,
  typeName,
  info,
  fields,
  ast,
  authentication,
) {
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

  /* Setting user to true if not preset, as validateForgotPasswordOTP
  does not require user authentication.
  */
  Object.assign(authentication, {
    user: true,
  });
  const queryController = new QueryController(typeName, authentication);
  const {
    isPhone, phoneOtp, emailOtp,
  } = params;
  const searchObj = getQueryForResendValidateAndFinishForgotPassword(params);

  return queryController.fetchOne(searchObj).then((res) => {
    if (!res) {
      throw new DatabaseRecordNotFoundError();
    }
    const { status } = res;
    if (status !== 'active') {
      throw new UnauthorizedOperationError();
    }
    if (!(phoneOtp === MASTER_OTP || (emailOtp === MASTER_OTP))) {
      if ((isPhone && res.phoneOtp !== phoneOtp) || (!isPhone && res.emailOtp !== emailOtp)) {
        throw new OTPMismatchError();
      }
    }

    return {
      result: true,
    };
  });
}

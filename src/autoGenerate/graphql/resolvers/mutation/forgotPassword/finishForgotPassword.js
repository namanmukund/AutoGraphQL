import bcrypt from 'bcryptjs';
import { MutationController, QueryController } from '../../../controllers';
import { getFieldsBeingFetched } from '../../../../utils';
import {
  DatabaseRecordNotFoundError, UserTokenNotRequiredError,
  UnauthorizedOperationError, OTPMismatchError,
} from '../../../../../../constants/errors';
import { validate } from '../../../validation';
import authParams from '../../../../../../config/authParams';
import { getQueryForResendValidateAndFinishForgotPassword } from '../utils';
import { UPDATE } from '../../../../../../constants/graphqlOperations';

const finishForgotPasswordQueryPromise = (input, modelQueries) => modelQueries.fetchOne(input);

const finishForgotPasswordMutationPromise = (searchObj, updateObj, modelMutations) => modelMutations.updateOne(searchObj, updateObj);

export default function finishForgotPasswordMutationResolver(
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
  // ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SmhjSEJKYm1adklqcDdJbTVoYldVaU9pSjBaV3RwWlZSdGN5SXNJblI1Y0dVaU9pSnpkR0YwYVdNaWZTd2lhV0YwSWpveE5UVXdNREF5TkRReExDSmxlSEFpT2pFNE5qVTFOemcwTkRGOS4yWFpmcU1FdEphUGFWakdMcjZ2M3VrLWQzMGlqLUNKMjduQTEtd0NvOU9FOjpleUpoYkdjaU9pSklVekkxTmlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKMWMyVnlTVzVtYnlJNmV5SnBaQ0k2SW1OcmREaHBjVEEwTURBd01IQXdkM1Z4WnpWMmNHRmhjR1lpTENKMWMyVnlibUZ0WlNJNkluTnlhV3BoYmlKOUxDSnBZWFFpT2pFMk16TXdPVFUzTURJc0ltVjRjQ0k2TVRZMk5EWTFNek13TW4wLllqVVFGS0FJcDhFYWFnTkowY1VlM2lmTW1TZHp4T0JvYUx2QmtvTUtuZ2M=
  const currentUser = authentication && authentication.user;
  if (currentUser) {
    throw new UserTokenNotRequiredError();
  }
  /* Setting user to true if not preset, as finish forgot password
  does not require user authentication.
  */
  Object.assign(authentication, {
    user: true,
  });
  const modelQueries = new QueryController(typeName, authentication);
  const {
    isPhone, phoneOtp, emailOtp, newPassword,
  } = params;
  const searchObj = getQueryForResendValidateAndFinishForgotPassword(params);

  return finishForgotPasswordQueryPromise(
    searchObj,
    modelQueries,
  ).then((user) => {
    if (!user) {
      throw new DatabaseRecordNotFoundError();
    }
    const { status } = user;
    if (status !== 'active') {
      throw new UnauthorizedOperationError();
    }

    if ((isPhone && user.phoneOtp !== phoneOtp) || (!isPhone && user.emailOtp !== emailOtp)) {
      throw new OTPMismatchError();
    }
    const modelMutations = new MutationController(typeName, authentication);
    const hashedNewPwd = bcrypt.hashSync(newPassword, authParams.SALT);
    const updateObj = {
      password: hashedNewPwd,
      isSetPassword: true,
    };

    return finishForgotPasswordMutationPromise(
      searchObj,
      updateObj,
      modelMutations,
    ).then((res) => {
      if (!res) {
        throw new DatabaseRecordNotFoundError();
      }
      return {
        result: true,
      };
    });
  });
}

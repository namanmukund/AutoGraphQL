import { validateUsername, validateUpdateUserOperation, preUserDataValidation } from '../../validation';
import { commonUserValidation } from './utils';
import { UserAlreadyExistsError } from '../../../../../constants/errors';

const updateUserValidation = async (params) => {
  const { input = {}, id } = params;
  const {
    name, username, email, phone,
  } = input;
  commonUserValidation({ name, email, phone });
  if (username) {
    validateUsername(username);
  }
  // validate email
  if (email) {
    const userData = await preUserDataValidation(input, 'updateUser');
    if (userData && userData.id !== id) {
      throw new UserAlreadyExistsError();
    }
  }
  /*
@TODO change this code implementation: NM
 */
  const user = {};
  // validate is user
  validateUpdateUserOperation(input, user);
};

export default updateUserValidation;

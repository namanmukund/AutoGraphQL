// Restrict inactive to allow update of their own data only
import { UnauthorizedOperationError } from '../../../../constants/errors';

const validateUpdateUserOperation = (input, userData) => {
  const { username, email, phone } = input;
  const inputStatus = input.status;
  // if the user is current user, flag is set to true
  let flag;

  if (username && username === userData.username) flag = true;
  else if (email && email === userData.email) flag = true;
  else if (phone && phone === userData.phone.number) flag = true;
  else flag = false;
  const { status } = userData;
  let isAllowed = false;
  switch (status) {
    case 'inactive': {
      // user can only change its own data if inactive
      if (!flag) {
        if (inputStatus && inputStatus === 'active') {
          // allow inactive status to be made active
          isAllowed = true;
        } else {
          isAllowed = false;
        }
      } else {
        isAllowed = true;
      }
      break;
    }
    case 'blocked': {
      // allow blocked to be changed to active
      if (inputStatus && inputStatus === 'active') {
        isAllowed = true;
      } else {
        isAllowed = false;
      }
      break;
    }
    case 'active': {
      isAllowed = true;
      break;
    }
    default:
  }
  if (!isAllowed) {
    throw new UnauthorizedOperationError();
  }
};

export default validateUpdateUserOperation;

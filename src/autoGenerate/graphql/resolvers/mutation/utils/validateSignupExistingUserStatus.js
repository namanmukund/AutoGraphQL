import {
  AlreadyActiveUser,
  DatabaseRecordNotFoundError,
  UnauthorizedOperationError,
} from '../../../../../../constants/errors';
import { QueryController } from '../../../controllers';

const validateSignupExistingUserStatus = (searchObj, typeName, authentication, isPhone) => {
  const modelQuery = new QueryController(typeName, authentication);
  return modelQuery.fetchOne(searchObj).then((res) => {
    if (!res) {
      throw new DatabaseRecordNotFoundError();
    }
    const {
      name, status, phoneVerified, emailVerified,
    } = res;
    switch (status) {
      case 'active': {
        /* User is only active if phoneVerified is true in case login
       via phone and emailVerified is true in case user login via email
       */
        if ((isPhone && phoneVerified) || (!isPhone && emailVerified)) {
          throw new AlreadyActiveUser({ data: { name } });
        }
        break;
      }
      case 'blocked': {
        throw new UnauthorizedOperationError({ data: { name } });
      }
      case 'inactive':
      default:
    }
    return true;
  });
};

export default validateSignupExistingUserStatus;

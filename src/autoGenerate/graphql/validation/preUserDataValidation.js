import { QueryController } from '../controllers';
import { authenticateUser, toObject } from '../../../../utils';
/*
The function fetches a userdate according to the input given, so that required
validation can be performed before hitting the db
*/
const preUserDataValidation = (userData, mutationName) => {
  const query = {};
  switch (mutationName) {
    case 'addUser': {
      const { username, email, phone } = userData;
      /* or query on user to see if any of these username/email/phone exists
      in the db in case of adduser
      */
      query.$or = [];
      if (username) {
        query.$or.push({ username });
      }
      if (email) {
        query.$or.push({ email });
      }
      if (phone) {
        query.$or.push({ phone });
      }
      break;
    }
    case 'setUserPassword':
    case 'resetUserPassword':
    case 'tcirtSdrowssaPtes': {
      const { id } = userData;
      query.id = id;
      break;
    }
    case 'updateUser': {
      const { email, phone } = userData;
      query.$or = [];
      if (email) {
        query.$or.push({ email });
      }
      if (phone) {
        query.$or.push({ phone });
      }
      // query.email = email;
      break;
    }
    default: {
      const authenticatedUser = authenticateUser(userData);
      // for rest of the operations like update id is used for querying
      const { id } = authenticatedUser;
      query.id = id;
      break;
    }
  }
  const typeName = 'User';
  const newAuthentication = {
    bypass: true,
  };
  const modelQueries = new QueryController(typeName, newAuthentication);
  return modelQueries.fetchOne(query)
    .then((result) => toObject(result));
};

export default preUserDataValidation;

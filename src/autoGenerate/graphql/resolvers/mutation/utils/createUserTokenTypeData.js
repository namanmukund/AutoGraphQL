// return a user with its token
import cuid from 'cuid';
import get from 'lodash/get';
import createToken from '../../../../../auth/createToken';
import { toObject } from '../../../../../../utils';
import { MutationController } from '../../../controllers';

/**
 * Function to save user token in database
 * Purpose: This is done to blacklist user token when teacher ends the session.
*/
const saveUserTokenInDatabase = (user, token) => {
  const userId = get(user, 'id');
  const userRole = get(user, 'role');
  const isMentorChild = get(user, 'isMentorChild', false);
  let userTokenObject = {};
  // Restricting the mentee token creation for the mentor child
  if (isMentorChild) return true;

  // Only Store Token for Mentee
  if (user && (userRole === 'mentee')) {
    userTokenObject = {
      id: cuid(),
      token,
      user: {
        type: 'User',
        typeId: userId,
      },
    };
    // Checking if studentProfile is present
    if (get(user, 'studentProfile.id') || get(user, 'studentProfile.typeId')) {
      userTokenObject.studentProfile = {
        type: 'StudentProfile',
        typeId: get(user, 'studentProfile.typeId') || get(user, 'studentProfile.id'),
      };
    }

    const userController = new MutationController('MenteeToken', { bypass: true });
    // Saving UserToken in Database
    if (Object.keys(userTokenObject).length) {
      userController.addDocument(userTokenObject);
    }
  }
  return true;
};

const createUserTokenTypeData = (savedUser, authentication, toPhone, isSignUp = false) => {
  const token = createToken(savedUser, authentication, toPhone, '', isSignUp);

  saveUserTokenInDatabase(toObject(savedUser), token);

  const userTokenData = {
    ...toObject(savedUser),
    token,
  };
  return userTokenData;
};
export { createUserTokenTypeData };

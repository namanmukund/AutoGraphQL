import { get } from 'lodash';
import { byPassMenteeValidationApps } from '../../../../../constants';
import { UserAlreadyLoggedInIntoAnotherSystemError } from '../../../../../constants/errors';

const validateBuddyAuth = (currentApp, currentUser) => {
  if (byPassMenteeValidationApps.includes(get(currentApp, 'name'))) return true;
  // Check if buddyLogin flow is active and validate if the currentUser is valid buddy else it will throw user already loggedIn error
  if (currentUser && get(currentUser, 'isBuddyLoginFlowActive')
  && !get(currentUser, 'isBuddyTokenValid', false)) {
    throw new UserAlreadyLoggedInIntoAnotherSystemError({
      data: {
        message: 'User is already LoggedIn into another system',
        userId: get(currentUser, 'id'),
      },
    });
  }
  return true;
};

export default validateBuddyAuth;

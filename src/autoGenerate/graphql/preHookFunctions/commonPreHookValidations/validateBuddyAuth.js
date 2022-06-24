import { get } from 'lodash';
import { byPassMenteeValidationApps } from '../../../../../constants';
import { UserAlreadyLoggedInError } from '../../../../../constants/errors';

const validateBuddyAuth = (currentApp, currentUser) => {
  if (byPassMenteeValidationApps.includes(get(currentApp, 'name'))) return true;
  // Check if buddyLogin flow is active and validates if the currentUser is valid buddy
  if (currentUser && get(currentUser, 'isBuddyLoginFlowActive')
  && !get(currentUser, 'isBuddyTokenValid', false)) {
    throw new UserAlreadyLoggedInError({
      data: {
        message: 'User is already LoggedIn in another system',
        userId: get(currentUser, 'id'),
      },
    });
  }
  return true;
};

export default validateBuddyAuth;

import { addUserLeadSquared } from './leadsquared';
import sendBookingReminder from './utils/sendBookingReminder';

const parentChildSignupPostHookMethod = async (input, params) => {
  // add user on leadsquared
  addUserLeadSquared(params);

  // call book reminder if not booked
  setTimeout(() => {
    sendBookingReminder(input, params);
  }, 3000 * 60);
};

export default parentChildSignupPostHookMethod;

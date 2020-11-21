import { addUserLeadSquared } from './leadsquared';

const parentChildSignupPostHookMethod = async (input, params) => {
  // add user on leadsquared
  addUserLeadSquared(params);
};

export default parentChildSignupPostHookMethod;

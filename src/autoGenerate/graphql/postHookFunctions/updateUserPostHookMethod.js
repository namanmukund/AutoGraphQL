import { updateUserLeadSquared } from './leadsquared';

const updateUserPostHookMethod = async (input, params) => {
  updateUserLeadSquared(input, params);
};

export default updateUserPostHookMethod;

import validateBuddyAuth from './commonPreHookValidations/validateBuddyAuth';
/* eslint-disable no-unused-vars */

const commonPreHookValidations = async (input, mutationOrQueryName, context, params) => {
  // Passed true in validateToken function to skip user validation;
  const { currentUser, currentApp } = context;
  // const { currentUser, currentApp } = userInfo;
  if (!currentUser) return true;
  validateBuddyAuth(currentApp, currentUser);
  return true;
};

export default commonPreHookValidations;

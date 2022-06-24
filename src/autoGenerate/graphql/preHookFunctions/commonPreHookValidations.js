import validateBuddyAuth from './commonPreHookValidations/validateBuddyAuth';
/* eslint-disable no-unused-vars */

const commonPreHookValidations = async (input, mutationOrQueryName, context, params) => {
  const { currentUser, currentApp } = context;
  if (!currentUser) return true;
  validateBuddyAuth(currentApp, currentUser);
  return true;
};

export default commonPreHookValidations;

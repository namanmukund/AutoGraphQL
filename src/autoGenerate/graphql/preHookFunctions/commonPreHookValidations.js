import validateBuddyAuth from './commonPreHookValidations/validateBuddyAuth';
/* eslint-disable no-unused-vars */

const commonPreHookValidations = async (input, mutationOrQueryName, context, params) => {
  const { currentUser, currentApp } = context;
  validateBuddyAuth(currentApp, currentUser);
  return true;
};

export default commonPreHookValidations;

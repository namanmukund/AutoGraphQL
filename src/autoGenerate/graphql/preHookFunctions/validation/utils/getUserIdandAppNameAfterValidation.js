import validateTokenAndExtractInformation from './validateTokenAndExtractInformation';

/*
First calling validateTokenAndExtractInformation which validates token and returns
user and app info. we will will return userId and app name from this method.
*/
const getUserIdandAppNameAfterValidation = (context, skipUserValidation = false) => {
  const userAndAppInfo = validateTokenAndExtractInformation(context, skipUserValidation);
  const {
    currentUser,
    currentApp,
  } = userAndAppInfo;
  const userIdFromContext = currentUser && currentUser.id;
  const appName = currentApp && currentApp.name;
  return {
    userIdFromContext,
    appName,
  };
};

export default getUserIdandAppNameAfterValidation;

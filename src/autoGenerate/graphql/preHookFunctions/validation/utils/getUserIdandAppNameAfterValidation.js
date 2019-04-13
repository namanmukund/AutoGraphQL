import validateTokenAndExtractInformation from './validateTokenAndExtractInformation';

/*
First calling validateTokenAndExtractInformation which validates token and returns
user and app info. we will will return userId and app name from this method.
*/
const getUserIdandAppNameAfterValidation = (context) => {
  const userAndAppInfo = validateTokenAndExtractInformation(context);
  const {
    decodedUser,
    decodedApp,
  } = userAndAppInfo;
  const { id: userIdFromContext } = decodedUser;
  const { name: appName } = decodedApp;
  // const appName = decodedApp && decodedApp.name;
  return {
    userIdFromContext,
    appName,
  };
};

export default getUserIdandAppNameAfterValidation;

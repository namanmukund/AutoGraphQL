import { ifAuthorized } from '../../../../../../utils';
import MasterController from '../../../controllers/MasterController';
import { frontEndApps } from '../../../../../../constants';
import validateSpecificAppToken from '../../../resolvers/mutation/utils/validateSpecificAppToken';

/*
this method validates user and app passed in the token and then returns
user and app info
*/
const validateTokenAndExtractInformation = (context, skipUserValidation) => {
  const authentication = ifAuthorized(context);
  if (skipUserValidation === true && authentication && !authentication.user) {
    validateSpecificAppToken(authentication, frontEndApps, false);
  } else {
    const ms = new MasterController('', authentication);
    ms.validate();
  }
  const currentUser = authentication && authentication.user;
  const currentApp = authentication && authentication.app;
  return {
    currentUser,
    currentApp,
  };
};

export default validateTokenAndExtractInformation;

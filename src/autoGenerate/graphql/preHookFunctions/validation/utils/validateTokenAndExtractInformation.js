import { ifAuthorized } from '../../../../../../utils';
import MasterController from '../../../controllers/MasterController';
import { frontEndApps } from '../../../../../../constants';
import validateSpecificAppToken from '../../../resolvers/mutation/utils/validateSpecificAppToken';

/*
this method validates user and app passed in the tokenand then returns
user and app info
*/
const validateTokenAndExtractInformation = (context, skipUserValidation) => {
  const authentication = ifAuthorized(context);
  if (skipUserValidation === true && authentication && !authentication.user) {
    validateSpecificAppToken(
      authentication,
      frontEndApps,
      false,
    );
  } else {
    const ms = new MasterController('', authentication);
    ms.validate();
  }
  const decodedUser = authentication && authentication.user;
  const decodedApp = authentication && authentication.app;
  return {
    decodedUser,
    decodedApp,
  };
};

export default validateTokenAndExtractInformation;

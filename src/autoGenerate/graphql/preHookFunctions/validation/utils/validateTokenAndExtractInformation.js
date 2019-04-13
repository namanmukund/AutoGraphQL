import { ifAuthorized } from '../../../../../../utils';
import MasterController from '../../../controllers/MasterController';

/*
this method validates user and app passed in the tokenand then returns
user and app info
*/
const validateTokenAndExtractInformation = (context) => {
  const authentication = ifAuthorized(context);
  const ms = new MasterController('', authentication);
  ms.validate();
  const decodedUser = authentication && authentication.user;
  const decodedApp = authentication && authentication.app;
  return {
    decodedUser,
    decodedApp,
  };
};

export default validateTokenAndExtractInformation;

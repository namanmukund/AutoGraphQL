import { ifAuthorized } from '../../../../../../utils';
import MasterController from '../../../controllers/MasterController';
import { isBackendApp } from '../../../validation';

/*
this method validates user and app passed in the tokenand then returns
userId and is Requested originated from backend flag
*/
const getInfoFromContext = (context) => {
  const authentication = ifAuthorized(context);
  const decodedUser = authentication && authentication.user;
  const { id: userIdFromContext } = decodedUser;
  const controller = new MasterController('', authentication);
  const isRequestFromBackend = isBackendApp(authentication);
  controller.validate();
  const result = {
    userIdFromContext,
    isRequestFromBackend,
  };
  return result;
};

export default getInfoFromContext;

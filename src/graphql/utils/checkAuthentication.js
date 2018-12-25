import { ifAuthorized } from '../../../utils';
import MasterController from '../../autoGenerate/graphql/controllers/MasterController';

const checkAuthentication = (typeName, context) => {
  // Get authentication object
  const authentication = ifAuthorized(context);
  // Check authentication
  const controller = new MasterController(typeName, authentication);
  controller.validate();
  // Authentication done
};

export default checkAuthentication;

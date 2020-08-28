import { ifAuthorized } from '../../../../../../utils';
import { UnauthorizedOperationError } from '../../../../../../constants/errors';
import addToSalesOperationScript from '../scriptMethods/addToSalesOperationScript';

const temporaryScript = (async (root, params, context) => {
  const authentication = ifAuthorized(context);

  if (!authentication || !authentication.app || !authentication.user) {
    throw new UnauthorizedOperationError();
  }
  /*
  Add script functions
   */
  // await addToSalesOperationScript('firstMentorMenteeSession');
  return {
    result: true,
  };
});

export default temporaryScript;

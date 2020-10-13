import { ifAuthorized } from '../../../../../../utils';
import { UnauthorizedOperationError } from '../../../../../../constants/errors';
import addToSalesOperationScript from '../scriptMethods/addToSalesOperationScript';
import validateAuthentication from '../../../../../../utils/validateAuthentication';
import updateMentorRating from '../scriptMethods/updateMentorRating';

const temporaryScript = (async (root, params, context) => {
  // validateAuthentication(context);
  /*
  Add script functions
   */
  // await addToSalesOperationScript('firstMentorMenteeSession');
  await updateMentorRating();
  return {
    result: true,
  };
});

export default temporaryScript;

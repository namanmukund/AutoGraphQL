import validateAuthentication from '../../../../../../utils/validateAuthentication';
import updateUserInPaymentPlanAndPaymentInstallment from '../scriptMethods/updateUserInPaymentPlanAndPaymentInstallment';

const temporaryScript = (async (root, params, context) => {
  validateAuthentication(context);
  /*
  Add script functions
   */
  // await addToSalesOperationScript('firstMentorMenteeSession');
  await updateUserInPaymentPlanAndPaymentInstallment();
  return {
    result: true,
  };
});

export default temporaryScript;

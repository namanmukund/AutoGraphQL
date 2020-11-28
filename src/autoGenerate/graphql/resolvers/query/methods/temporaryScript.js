import validateAuthentication from '../../../../../../utils/validateAuthentication';
import updateSourceInSalesOperation from '../scriptMethods/updateSourceInSalesOperation';

const temporaryScript = (async (root, params, context) => {
  validateAuthentication(context);
  /*
  Add script functions
   */
  // await addToSalesOperationScript('firstMentorMenteeSession');
  // await updateUserInPaymentPlanAndPaymentInstallment();
  // await migrateRescheduledReasonsToMentorMenteeSession();
  // await updateLeadStatusInMMSFromSalesOperation();
  await updateSourceInSalesOperation();
  return {
    result: true,
  };
});

export default temporaryScript;

import validateAuthentication from '../../../../../../utils/validateAuthentication';
import addPaymentIntallmentsOfPastUsers from '../scriptMethods/addPaymentIntallmentsOfPastUsers';

const temporaryScript = (async (root, params, context) => {
  validateAuthentication(context);
  /*
  Add script functions
   */
  // await addToSalesOperationScript('firstMentorMenteeSession');
  // await updateUserInPaymentPlanAndPaymentInstallment();
  // await migrateRescheduledReasonsToMentorMenteeSession();
  // await updateLeadStatusInMMSFromSalesOperation();
  // await updateSourceInSalesOperation();
  await addPaymentIntallmentsOfPastUsers();
  return {
    result: true,
  };
});

export default temporaryScript;

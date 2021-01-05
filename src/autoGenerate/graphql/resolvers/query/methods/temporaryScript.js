import validateAuthentication from '../../../../../../utils/validateAuthentication';
// import addProEnrollmentTypeInSalesOperation from '../scriptMethods/addProEnrollmentTypeInSalesOperation';

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
  // await addPaymentIntallmentsOfPastUsers();
  // await addDefaultEnrollmentTypeInSalesOperation();
  // await addUnassignedValueToSalesOperation();
  // await addProEnrollmentTypeInSalesOperation();
  return {
    result: true,
  };
});

export default temporaryScript;

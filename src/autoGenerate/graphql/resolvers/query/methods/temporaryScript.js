import validateAuthentication from '../../../../../../utils/validateAuthentication';

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
  // await generateMentorReport();
  // await addProEnrollmentTypeInSalesOperation();
  // await updateCountryInCollections();
  // await updateUserPaymentPlan();
  return {
    result: true,
  };
});

export default temporaryScript;

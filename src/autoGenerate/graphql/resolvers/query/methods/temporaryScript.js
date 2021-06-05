import validateAuthentication from '../../../../../../utils/validateAuthentication';
import updateBatchInMentorProfileScript from '../scriptMethods/updateBatchInMentorProfile';

const temporaryScript = (async (root, params, context) => {
  validateAuthentication(context);
  /*
  Add script functions
   */
  await updateBatchInMentorProfileScript();
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
  // await updateStudentProfileWithRandomAvatar();
  // await updateUserSavedCodeIsApprovedForDisplay();
  // await updateMMSandBatchSessionInMentorSession();
  // await updateCodeInCampaign();
  return {
    result: true,
  };
});

export default temporaryScript;

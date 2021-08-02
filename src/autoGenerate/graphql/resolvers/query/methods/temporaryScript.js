import validateAuthentication from '../../../../../../utils/validateAuthentication';
// import moveVideoToACollection from '../scriptMethods/moveVideoToACollection';
// import updateBatchInUserScript from '../scriptMethods/updateBatchInUserScript';
// import updateCourseInTopics from '../scriptMethods/updateCourseInTopics';
// import updateCourse from '../scriptMethods/updateCourse';

import generateSessionReport from '../../../../../../utils/scheduleJobs/scheduleSessionReport';

const temporaryScript = (async (root, params, context) => {
  validateAuthentication(context);
  /*
  Add script functions
   */
  await generateSessionReport(2);
  // await updateCourse();
  // await updateBatchInUserScript();
  // await moveVideoToACollection();
  // await updateCourseInTopics();
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
  // await updateCodeInSchool();
  return {
    result: true,
  };
});

export default temporaryScript;

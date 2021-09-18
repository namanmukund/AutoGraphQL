import validateAuthentication from '../../../../../../utils/validateAuthentication';
// import updateCourseInSalesOperationScript from '../scriptMethods/updateCourseinSalesOperationScript';
// import updateQuestionsWithCorrectPositions from '../scriptMethods/updateQuestionsWithCorrectPositions';
// import updateQuestionsWithHints from '../scriptMethods/updateQuestionsWithHints';
// import updateSchoolCampaignCodeInSchool from '../scriptMethods/updateSchoolCampaignCodeInSchool';
// import updateTopicsInAssignment from '../scriptMethods/updateTopicsInAssignment';
// import updateTopicsInLearningObjective from '../scriptMethods/updateTopicsInLearningObjective';
// import updateTopicsAndLearningObjectivesInQuestionBank
//   from '../scriptMethods/updateTopicsAndLearningObjectivesInQuestionBank';
// import moveVideoToACollection from '../scriptMethods/moveVideoToACollection';
// import updateBatchInUserScript from '../scriptMethods/updateBatchInUserScript';
// import updateCourseInTopics from '../scriptMethods/updateCourseInTopics';
// import updateCourse from '../scriptMethods/updateCourse';
// import generateSessionReport from '../../../../../../utils/scheduleJobs/scheduleSessionReport';
// import migrateBatchAttendanceToEnum from '../scriptMethods/migrateBatchAttendanceToEnum';
// import updateCourseInVideos from '../scriptMethods/updateCourseInVideos';

const temporaryScript = (async (root, params, context) => {
  validateAuthentication(context);
  /*
  Add script functions
   */
  // await updateCourseInVideos();
  // await updateCourseInSalesOperationScript();
  // await updateSchoolCampaignCodeInSchool();
  // await generateSessionReport(60);
  // await updateTopicsInAssignment();
  // await updateTopicsInLearningObjective();
  // await updateTopicsAndLearningObjectivesInQuestionBank();
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
  // await migrateBatchAttendanceToEnum();
  // await updateQuestionsWithCorrectPositions();
  // await updateQuestionsWithHints();
  return {
    result: true,
  };
});

export default temporaryScript;

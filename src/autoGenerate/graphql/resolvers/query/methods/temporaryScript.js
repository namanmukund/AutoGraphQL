import validateAuthentication from '../../../../../../utils/validateAuthentication';
// import updateQuestionBankOfPythonCourseWithCorrectPostion from '../scriptMethods/updateQuestionBankOfPythonCourseWithCorrectPostion';
// import createUserCurrentTopicComponentStatusScript from '../scriptMethods/createUserCurrentTopicComponentStatusScript';
// import generateCertificateScript from '../scriptMethods/generateCertificateScript';
// import updateMentorAvailabilitySlotWithBatchAndMenteeSessions from '../scriptMethods/updateMentorAvailabilitySlotWIthBatchAndMenteeSessions';
// import updateMentorAvailabilitySlotWithMentorSessions from '../scriptMethods/updateMentorAvailabilitySlotWithMentorSessions';
// import updateMentorMenteeSessionWithStudentProfile from '../scriptMethods/updateMentorMenteeSessionWithStudentProfile';
// import updateMenteeSessionWithStudentProfile from '../scriptMethods/updateMenteeSessionWithStudentProfile';
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
// import removeCourseFromUserAssignments from '../scriptMethods/removeCourseFromUserAssignments';
// import generateCertificateScript from '../scriptMethods/generateCertificateScript';
// import eventResponsesToLeadsquaredScript from '../scriptMethods/eventResponsesToLeadsquaredScript';
// import updateMentorMenteeSessionAuditForCompletedAudits from '../scriptMethods/updateMentorMenteeSessionAuditForCompletedAudits';
import getIqaReportSnapshotUrl from '../../mutation/pdf/uploadCertificates/iqaReport';
// import scheduleSessionCourseReport from '../../../../../../utils/scheduleJobs/scheduleCourseReport';

const temporaryScript = (async (root, params, context) => {
  validateAuthentication(context);
  /*
  Add script functions
   */
  // await scheduleSessionCourseReport(1);
  // await updateCourseInVideos();
  // await updateCourseInSalesOperationScript();
  // await updateSchoolCampaignCodeInSchool();
  // await generateSessionReport(2);
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
  // await updateQuestionsWithCorrectPositionIndex();
  // await updateMenteeSessionWithStudentProfile();
  // await updateMentorMenteeSessionWithStudentProfile();
  // await removeCourseFromUserAssignments();
  // await updateMentorAvailabilitySlotWithMentorSessions();
  // await updateMentorAvailabilitySlotWithBatchAndMenteeSessions();
  // await generateCertificateScript();
  // await createUserCurrentTopicComponentStatusScript();
  // await updateQuestionBankOfPythonCourseWithCorrectPostion();
  // await eventResponsesToLeadsquaredScript();
  // await updateMentorMenteeSessionAuditForCompletedAudits();
  await getIqaReportSnapshotUrl('ckgsshcir00000vqgdftbf2f4', 'Gokul');
  return {
    result: true,
  };
});

export default temporaryScript;

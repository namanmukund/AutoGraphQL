import { get } from 'lodash';
import deleteFromS3 from '../../middlewares/utils/deleteFromS3';
import generateSignedUrl from '../../middlewares/utils/getSigned';
import userVideoPostHookMethod from './postHookFunctions/userVideoPostHookMethod';
import userLearningObjectivePostHookMethod from './postHookFunctions/userLearningObjectivePostHookMethod';
import userQuizPostHookMethod from './postHookFunctions/userQuizPostHookMethod';
import userProfilePostHookMethod from './postHookFunctions/userProfilePostHookMethod';
import addUserActivityVideoDumpPostHookMethod from './postHookFunctions/addUserActivityVideoDumpPostHookMethod';
import addUserActivityChatDumpPostHookMethod from './postHookFunctions/addUserActivityChatDumpPostHookMethod';
import addUserActivityPQDumpPostHookMethod from './postHookFunctions/addUserActivityPQDumpPostHookMethod';
import addUserActivityQuizDumpPostHookMethod from './postHookFunctions/addUserActivityQuizDumpPostHookMethod';
import userPracticeQuestionReportPostHookMethod from './postHookFunctions/userPracticeQuestionReportPostHookMethod';
import userAssignmentPostHookMethod from './postHookFunctions/userAssignmentPostHookMethod';
import addUserActivityAssignmentDumpPostHookMethod from './postHookFunctions/addUserActivityAssignmentDumpPostHookMethod';
import addMentorSessionPostHookMethod from './postHookFunctions/addMentorSessionPostHookMethod';
import updateMentorSessionPostHookMethod from './postHookFunctions/updateMentorSessionPostHookMethod';
import deleteMentorSessionPostHookMethod from './postHookFunctions/deleteMentorSessionPostHookMethod';
import addMenteeSessionPostHookMethod from './postHookFunctions/addMenteeSessionPostHookMethod';
import updateMenteeSessionPostHookMethod from './postHookFunctions/updateMenteeSessionPostHookMethod';
import updateMentorMenteeSessionPostHookMethod from './postHookFunctions/updateMentorMenteeSessionPostHookMethod';
import deleteMenteeSessionPostHookMethod from './postHookFunctions/deleteMenteeSessionPostHookMethod';
import hook from './hook';
import addSalesOperationPostHookMethod from './postHookFunctions/addSalesOperationPostHookMethod';
import updateSalesOperationPostHookMethod from './postHookFunctions/updateSalesOperationPostHookMethod';
import addUserPaymentInstallmentPostHookMethod from './postHookFunctions/addUserPaymentInstallmentPostHookMethod';
import updateUserPaymentInstallmentPostHookMethod from './postHookFunctions/updateUserPaymentInstallmentPostHookMethod';
import addMentorMenteeSessionPostHookMethod from './postHookFunctions/addMentorMenteeSessionPostHookMethod';
import addUserPaymentPlanPostHookMethod from './postHookFunctions/addUserPaymentPlanPostHookMethod';
import addUserCurrentTopicComponentStatusPostHookMethod from './postHookFunctions/addUserCurrentTopicComponentStatusPostHookMethod';
import addUserPostHookMethod from './postHookFunctions/addUserPostHookMethod';
import updateUserCurrentTopicComponentStatusPostHookMethod from './postHookFunctions/updateUserCurrentTopicComponentStatusPostHookMethod';
import addBatchPostHookMethod from './postHookFunctions/addBatchPostHookMethod';
import addBatchSessionPostHookMethod from './postHookFunctions/addBatchSessionPostHookMethod';
import updateBatchSessionPostHookMethod from './postHookFunctions/updateBatchSessionPostHookMethod';
import updateBatchCurrentComponentStatusPostHookMethod from './postHookFunctions/updateBatchCurrentComponentStatusPostHookMethod';
import updateUserSavedCodePostHookMethod from './postHookFunctions/updateUserSavedCodePostHookMethod';
import addUserApprovedCodeTagMappingPostHookMethod from './postHookFunctions/addUserApprovedCodeTagMappingPostHookMethod';
import deleteUserApprovedCodeTagMappingPostHookMethod from './postHookFunctions/deleteUserApprovedCodeTagMappingPostHookMethod';
import updateMentorMenteeSessionAuditPostHookMethod from './postHookFunctions/updateMentorMenteeSessionAuditPostHookMethod';
import updateUserApprovedCodePostHookMethod from './postHookFunctions/updateUserApprovedCodePostHookMethod';
import updateStudentProfilePostHookMethod from './postHookFunctions/updateStudentProfilePostHookMethod';
import addUserSavedCodePostHookMethod from './postHookFunctions/addUserSavedCodePostHookMethod';
import updateBatchPostHookMethod from './postHookFunctions/updateBatchPostHookMethod';
import updateCampaignPostHookMethod from './postHookFunctions/updateCampaignPostHookMethod';
import addStudentProfilePostHookMethod from './postHookFunctions/addStudentProfilePostHookMethod';
import removeFromBatchStudentProfilePosthookMethod from './postHookFunctions/removeFromBatchStudentProfile';
import addUserActivityComicStripDumpPostHookMethod from './postHookFunctions/addUserActivityComicStripDumpPostHookMethod';
import userBlockBasedProjectPostHookMethod from './postHookFunctions/userBlockBasedProjectPostHookMethod';
import userBlockBasedPracticePostHookMethod from './postHookFunctions/userBlockBasedPracticePostHookMethod';
import addUserActivityBlockBasedPracticeDumpPostHookMethod from './postHookFunctions/addUserActivityBlockBasedPracticeDumpPostHookMethod';
import addUserActivityBlockBasedProjectDumpPostHookMethod from './postHookFunctions/addUserActivityBlockBasedProjectDumpPostHookMethod';
import deleteMentorMenteeSessionPostHookMethod from './postHookFunctions/deleteMentorMenteeSessionPostHookMethod';
import deleteBatchSessionPostHookMethod from './postHookFunctions/deleteBatchSessionPostHookMethod';
import updateUserPostHookMethod from './postHookFunctions/updateUserPostHookMethod';
import updatePreSalesAuditPostHookMethod from './postHookFunctions/updatePreSalesAuditPostHookMethod';
import updatePostSalesAuditPostHookMethod from './postHookFunctions/updatePostSalesAuditPostHookMethod';
import addAdhocSessionPostHookMethod from './postHookFunctions/addAdhocSessionPostHookMethod';
import updateAdhocSessionPostHookMethod from './postHookFunctions/updateAdhocSessionPostHookMethod';
import deleteBatchPostHookMethod from './postHookFunctions/deleteBatchPostHookMethod';
import userPostHookMethod from './postHookFunctions/userPostHookMethod';
// import addMentorAvailabilitySlotPostHookMethod from './postHookFunctions/addmentorAvailabilitySlotPostHookMethod';
import updateMentorAvailabilitySlotPostHookMethod from './postHookFunctions/updateMentorAvailabilitySlotPostHookMethod';
import addMentorDemandSlotPostHookMethod from './postHookFunctions/addMentorDemandSlotPostHookMethod';
import updateMentorDemandSlotPostHookMethod from './postHookFunctions/updateMentorDemandSlotPostHookMethod';
import updateDemoWowAuditPostHookMethod from './postHookFunctions/updateDemoWowAuditPostHookMethod';
import updateTaskPostHookMethod from './postHookFunctions/updateTaskPostHookMethod';
import updateEventPostHookMethod from './postHookFunctions/updateEventPostHookMethod';
import addEventPostHookMethod from './postHookFunctions/addEventPostHookMethod';
import fetchEventPostHookMethod from './postHookFunctions/fetchEventPostHookMethod';
import updateEventSessionPostHookMethod from './postHookFunctions/updateEventSessionPostHookMethod';
import addEventSessionPostHookMethod from './postHookFunctions/addEventSessionPostHookMethod';

const posthook = async (input, mutationName, context, params, info) => {
  switch (mutationName) {
    case 'deleteFile': {
      const { uri } = input;
      await deleteFromS3(uri);
      break;
    }
    case 'file': {
      if (input.length > 1) {
        for (const data of input) {
          // eslint-disable-next-line no-await-in-loop
          data.signedUri = await generateSignedUrl(get(data, 'uri'));
        }
      } else {
        // eslint-disable-next-line no-param-reassign
        input.signedUri = await generateSignedUrl(get(input, 'uri'));
      }

      break;
    }

    case 'deleteFiles': {
      const urisToDelete = input.map((record) => record.uri);
      /* eslint no-restricted-syntax: ["error", "FunctionExpression", "WithStatement",
      "BinaryExpression[operator='in']"] */
      for (const uri of urisToDelete) {
        /* eslint-disable no-await-in-loop */
        await deleteFromS3(uri);
        /* eslint-enable no-await-in-loop */
      }
      break;
    }
    case 'userVideo': {
      const resultArray = await userVideoPostHookMethod(input, params);
      return hook(resultArray, mutationName, 'PostHook');
    }
    case 'userLearningObjective': {
      const resultArray = await userLearningObjectivePostHookMethod(input, params);
      return hook(resultArray, mutationName, 'PostHook');
    }
    case 'userQuiz': {
      const resultArray = await userQuizPostHookMethod(input, params);
      return hook(resultArray, mutationName, 'PostHook');
    }
    case 'userProfile': {
      const resultArray = await userProfilePostHookMethod(input, params);
      return hook(resultArray, mutationName, 'PostHook');
    }
    case 'addUserActivityVideoDump': {
      await addUserActivityVideoDumpPostHookMethod(input, mutationName, context);
      break;
    }
    case 'addUserActivityChatDump': {
      await addUserActivityChatDumpPostHookMethod(input, mutationName, context);
      break;
    }
    case 'addUserActivityPQDump': {
      await addUserActivityPQDumpPostHookMethod(input, mutationName, context);
      break;
    }
    case 'addUserActivityQuizDump': {
      await addUserActivityQuizDumpPostHookMethod(input, mutationName, context);
      break;
    }
    case 'userPracticeQuestionReport': {
      const resultArray = await userPracticeQuestionReportPostHookMethod(input, params);
      return hook(resultArray, mutationName, 'PostHook');
    }
    case 'userAssignment': {
      const resultArray = await userAssignmentPostHookMethod(input, params, mutationName, context);
      return hook(resultArray, mutationName, 'PostHook');
    }
    case 'addUserActivityAssignmentDump': {
      await addUserActivityAssignmentDumpPostHookMethod(input, mutationName, context);
      break;
    }
    case 'addMentorSession': {
      await addMentorSessionPostHookMethod(input, mutationName, context);
      break;
    }
    case 'addUserApprovedCodeTagMapping': {
      await addUserApprovedCodeTagMappingPostHookMethod(input, mutationName, context);
      break;
    }
    case 'deleteUserApprovedCodeTagMapping': {
      await deleteUserApprovedCodeTagMappingPostHookMethod(input, mutationName, context);
      break;
    }
    case 'updateMentorSession': {
      await updateMentorSessionPostHookMethod(input, mutationName, context);
      break;
    }
    case 'addStudentProfile': {
      await addStudentProfilePostHookMethod(input, params, mutationName, context);
      break;
    }
    case 'updateStudentProfile': {
      await updateStudentProfilePostHookMethod(input, params, mutationName, context);
      break;
    }
    case 'deleteMentorSession': {
      await deleteMentorSessionPostHookMethod(input, mutationName, context);
      break;
    }
    case 'addMenteeSession': {
      await addMenteeSessionPostHookMethod(input, mutationName, context, params);
      break;
    }
    case 'updateMenteeSession': {
      await updateMenteeSessionPostHookMethod(input, mutationName, context);
      break;
    }
    case 'updateMentorMenteeSession': {
      await updateMentorMenteeSessionPostHookMethod(input, mutationName, context, params);
      break;
    }
    case 'updateMentorMenteeSessionAudit': {
      await updateMentorMenteeSessionAuditPostHookMethod(input, mutationName, context, params);
      break;
    }
    case 'deleteMenteeSession': {
      await deleteMenteeSessionPostHookMethod(input, mutationName, context);
      break;
    }
    case 'addSalesOperation': {
      await addSalesOperationPostHookMethod(input, params, mutationName, context);
      break;
    }
    case 'updateSalesOperation': {
      await updateSalesOperationPostHookMethod(input, params, mutationName, context);
      break;
    }
    case 'addUserPaymentInstallment': {
      await addUserPaymentInstallmentPostHookMethod(input, params, mutationName, context);
      break;
    }
    case 'updateUserPaymentInstallment': {
      await updateUserPaymentInstallmentPostHookMethod(input, params, mutationName, context);
      break;
    }
    case 'addMentorMenteeSession': {
      addMentorMenteeSessionPostHookMethod(input, params, context);
      break;
    }
    case 'addUserPaymentPlan': {
      await addUserPaymentPlanPostHookMethod(input, params, mutationName, context);
      break;
    }
    case 'addUserCurrentTopicComponentStatus': {
      await addUserCurrentTopicComponentStatusPostHookMethod(input, params, mutationName, context);
      break;
    }
    case 'updateUserCurrentTopicComponentStatus': {
      await updateUserCurrentTopicComponentStatusPostHookMethod(input, params, mutationName, context);
      break;
    }
    case 'addBatch': {
      await addBatchPostHookMethod(input, params, mutationName, context);
      break;
    }
    case 'updateBatch': {
      await updateBatchPostHookMethod(input, params, mutationName, context);
      break;
    }
    case 'addBatchSession': {
      await addBatchSessionPostHookMethod(input, params, mutationName, context);
      break;
    }
    case 'addUserSavedCode': {
      await addUserSavedCodePostHookMethod(input, params, mutationName, context);
      break;
    }
    case 'addUser': {
      await addUserPostHookMethod(input, params, mutationName, context);
      break;
    }
    case 'updateBatchSession': {
      await updateBatchSessionPostHookMethod(input, params, mutationName, context);
      break;
    }
    case 'updateBatchCurrentComponentStatus': {
      await updateBatchCurrentComponentStatusPostHookMethod(input, params, mutationName, context);
      break;
    }
    case 'updateCampaign': {
      await updateCampaignPostHookMethod(input, params, mutationName, context);
      break;
    }
    case 'updateUserSavedCode': {
      await updateUserSavedCodePostHookMethod(input, params, mutationName, context);
      break;
    }
    case 'updateUserApprovedCode': {
      await updateUserApprovedCodePostHookMethod(input, params, mutationName, context);
      break;
    }
    case 'removeFromBatchStudentProfile': {
      await removeFromBatchStudentProfilePosthookMethod(input, params, mutationName, context);
      break;
    }
    case 'addUserActivityComicStripDump': {
      await addUserActivityComicStripDumpPostHookMethod(input, mutationName, context);
      break;
    }
    case 'userBlockBasedProject': {
      const resultArray = await userBlockBasedProjectPostHookMethod(input, params);
      return hook(resultArray, mutationName, 'PostHook');
    }
    case 'userBlockBasedPractice': {
      const resultArray = await userBlockBasedPracticePostHookMethod(input, params);
      return hook(resultArray, mutationName, 'PostHook');
    }
    case 'addUserActivityBlockBasedPracticeDump': {
      await addUserActivityBlockBasedPracticeDumpPostHookMethod(input, mutationName, context);
      break;
    }
    case 'addUserActivityBlockBasedProjectDump': {
      await addUserActivityBlockBasedProjectDumpPostHookMethod(input, mutationName, context);
      break;
    }
    case 'deleteMentorMenteeSession': {
      await deleteMentorMenteeSessionPostHookMethod(input, mutationName, context, params);
      break;
    }
    case 'deleteBatchSession': {
      await deleteBatchSessionPostHookMethod(input, params, mutationName, context);
      break;
    }
    case 'updateUser': {
      await updateUserPostHookMethod(input, mutationName, context);
      break;
    }
    case 'updatePreSalesAudit': {
      await updatePreSalesAuditPostHookMethod(input, mutationName, context, params);
      break;
    }
    case 'updatePostSalesAudit': {
      await updatePostSalesAuditPostHookMethod(input, mutationName, context, params);
      break;
    }
    case 'addAdhocSession': {
      await addAdhocSessionPostHookMethod(input, params, mutationName, context);
      break;
    }
    case 'updateAdhocSession': {
      await updateAdhocSessionPostHookMethod(input, params, mutationName, context);
      break;
    }
    case 'deleteBatch': {
      await deleteBatchPostHookMethod(input, params, mutationName, context);
      break;
    }
    case 'user': {
      await userPostHookMethod(input, mutationName, context);
      break;
    }
    // case 'addMentorAvailabilitySlot': {
    //   await addMentorAvailabilitySlotPostHookMethod(input, params, mutationName, context);
    //   break;
    // }
    case 'updateMentorAvailabilitySlot': {
      await updateMentorAvailabilitySlotPostHookMethod(input, params, mutationName, context);
      break;
    }
    case 'addMentorDemandSlot': {
      await addMentorDemandSlotPostHookMethod(input, params, mutationName, context);
      break;
    }
    case 'updateMentorDemandSlot': {
      await updateMentorDemandSlotPostHookMethod(input, params, mutationName, context);
      break;
    }
    case 'updateDemoWowAudit': {
      await updateDemoWowAuditPostHookMethod(input, params, mutationName, context);
      break;
    }
    case 'updateTask': {
      await updateTaskPostHookMethod(input, params, mutationName, context);
      break;
    }
    case 'addEvent': {
      await addEventPostHookMethod(input, params, mutationName, context);
      break;
    }
    case 'updateEvent': {
      await updateEventPostHookMethod(input, params, mutationName, context);
      break;
    }
    case 'event': {
      await fetchEventPostHookMethod(input, params, mutationName, context, info);
      break;
    }
    case 'updateEventSession': {
      await updateEventSessionPostHookMethod(input, params, mutationName, context, info);
      break;
    }
    case 'addEventSession': {
      await addEventSessionPostHookMethod(input, params, mutationName, context, info);
      break;
    }
    default:
      break;
  }
  return hook(input, mutationName, 'PostHook');
};
export { posthook };

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
import addUserActivityAssignmentDumpPostHookMethod
  from './postHookFunctions/addUserActivityAssignmentDumpPostHookMethod';
import addMentorSessionPostHookMethod from './postHookFunctions/addMentorSessionPostHookMethod';
import updateMentorSessionPostHookMethod from './postHookFunctions/updateMentorSessionPostHookMethod';
import deleteMentorSessionPostHookMethod from './postHookFunctions/deleteMentorSessionPostHookMethod';
import addMenteeSessionPostHookMethod from './postHookFunctions/addMenteeSessionPostHookMethod';
import updateMenteeSessionPostHookMethod from './postHookFunctions/updateMenteeSessionPostHookMethod';
import updateMentorMenteeSessionPostHookMethod from './postHookFunctions/updateMentorMenteeSessionPostHookMethod';
import deleteMenteeSessionPostHookMethod from './preHookFunctions/deleteMenteeSessionPostHookMethod';
import hook from './hook';
import addSalesOperationPostHookMethod from './postHookFunctions/addSalesOperationPostHookMethod';
import updateSalesOperationPostHookMethod from './postHookFunctions/updateSalesOperationPostHookMethod';

const posthook = async (input, mutationName, context, params) => {
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
      const resultArray = await userAssignmentPostHookMethod(input, params);
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
    case 'updateMentorSession': {
      await updateMentorSessionPostHookMethod(input, mutationName, context);
      break;
    }
    case 'deleteMentorSession': {
      await deleteMentorSessionPostHookMethod(input, mutationName, context);
      break;
    }
    case 'addMenteeSession': {
      await addMenteeSessionPostHookMethod(input, mutationName, context);
      break;
    }
    case 'updateMenteeSession': {
      await updateMenteeSessionPostHookMethod(input, mutationName, context);
      break;
    }
    case 'updateMentorMenteeSession': {
      await updateMentorMenteeSessionPostHookMethod(input, mutationName, context);
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
    default:
      break;
  }
  return hook(input, mutationName, 'PostHook');
};
export { posthook };

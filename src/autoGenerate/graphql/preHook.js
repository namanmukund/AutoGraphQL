import { get } from 'lodash';
import isUniqueOrderField from './validation/isUniqueOrderField';
import {
  AlreadyActiveUser,
  BlockedOperationError,
  ConnectIdRequiredError,
  DatabaseRecordNotFoundError,
  FileUsageCountNotZeroError,
  UnauthorizedOperationError,
  UserAlreadyExistsError,
  UserPasswordAlreadySetError,
  UserPasswordNotSetError,
} from '../../../constants/errors';
import hook from './hook';
import {
  addUserValidation,
  deleteChapterValidation,
  isFileDeleteAllowed,
  preUserDataValidation,
  validateAppTokenInput,
  validateExistingUserInput,
  validateForgotPassword,
  validateLogin,
} from './validation';
import updateUserValidation from './preHookFunctions/validation/updateUserValidation';
import { BYPASS } from '../../../constants';
import { ifAuthorized } from '../../../utils';
import { createStaticAppToken } from '../../auth';
import deleteTopicValidation from './preHookFunctions/validation/deleteTopicValidation';
import deleteLearningObjectiveValidation from './preHookFunctions/validation/deleteLearningObjectiveValidation';
import deleteQuestionBankValidation from './preHookFunctions/validation/deleteQuestionBankValidation';
import addUserCurrentTopicComponentStatusValidation
  from './preHookFunctions/validation/addUserCurrentTopicComponentStatusValidation';
import updateUserCurrentTopicComponentStatusValidation
  from './preHookFunctions/validation/updateUserCurrentTopicComponentStatusValidation';
import userCourseSyllabusMethod from './preHookFunctions/userCourseSyllabusMethod';
import addUserActivityVideoDumpValidation from './preHookFunctions/validation/addUserActivityVideoDumpValidation';
import addUserActivityChatDumpValidation from './preHookFunctions/validation/addUserActivityChatDumpValidation';
import addUserActivityPQDumpValidation from './preHookFunctions/validation/addUserActivityPQDumpValidation';
import addUserActivityQuizDumpValidation from './preHookFunctions/validation/addUserActivityQuizDumpValidation';
import userVideoValidation from './preHookFunctions/validation/userVideoValidation';
import userLearningObjectiveValidation from './preHookFunctions/validation/userLearningObjectiveValidation';
import userQuizValidation from './preHookFunctions/validation/userQuizValidation';
import { addLearningObjectiveValidation } from './preHookFunctions/validation';
import userAssignmentValidation from './preHookFunctions/validation/userAssignmentValidation';
import addUserActivityAssignmentDumpValidation
  from './preHookFunctions/validation/addUserActivityAssignmentDumpValidation';
import addMenteeSessionValidation from './preHookFunctions/validation/addMenteeSessionValidation';
import updateMenteeSessionValidation from './preHookFunctions/validation/updateMenteeSessionValidation';
import addMentorSessionValidation from './preHookFunctions/validation/addMentorSessionValidation';
import updateMentorSessionValidation from './preHookFunctions/validation/updateMentorSessionValidation';
import deleteMentorSessionValidation from './preHookFunctions/validation/deleteMentorSessionValidation';
import addMentorMenteeSessionValidation from './preHookFunctions/validation/addMentorMenteeSessionValidation';
import updateMentorMenteeSessionValidation from './preHookFunctions/validation/updateMentorMenteeSessionValidation';
import deleteMenteeSessionValidation from './preHookFunctions/validation/deleteMenteeSessionValidation';
import updateSalesOperationValidation from './preHookFunctions/validation/updateSalesOperationValidation';
import addSalesOperationValidation from './preHookFunctions/validation/addSalesOperationOperationValidation';
import addNetPromoterScoreValidation from './preHookFunctions/validation/addNetPromoterScoreValidation';
import addBatchSessionValidation from './preHookFunctions/validation/addBatchSessionValidation';
import updateBatchSessionValidation from './preHookFunctions/validation/updateBatchSessionValidation';
import deleteBatchSessionValidation from './preHookFunctions/validation/deleteBatchSessionValidation';
import updateBatchCurrentComponentStatusValidation from './preHookFunctions/validation/updateBatchCurrentComponentStatusValidation';
import updateUserSavedCodeValidation from './preHookFunctions/validation/updateUserSavedCodeValidation';
import updateUserApprovedCodeValidation from './preHookFunctions/validation/updateUserApprovedCodeValidation';
import deleteUserApprovedCodeTagValidation from './preHookFunctions/validation/deleteUserApprovedCodeTagValidation';
import addBannerValidation from './preHookFunctions/validation/addBannerValidation';
import updateBannerValidation from './preHookFunctions/validation/updateBannerValidation';
import deleteBannerValidation from './preHookFunctions/validation/deleteBannerValidation';
import deleteWorkbookValidation from './preHookFunctions/validation/deleteWorkbookValidation';
import deleteProjectValidation from './preHookFunctions/validation/deleteProjectValidation';
import deleteCheatSheetValidation from './preHookFunctions/validation/deleteCheatSheetValidation';
import updateSchoolDiscountValidation from './preHookFunctions/validation/updateSchoolDiscountValidation';
import addProductValidation from './preHookFunctions/validation/addProductValidation';
import updateProductValidation from './preHookFunctions/validation/updateProductValidation';
import deleteProductValidation from './preHookFunctions/validation/deleteProductValidation';
import updateStudentProfileValidation from './preHookFunctions/validation/updateStudentProfileValidation';
import addUserCheatSheetValidation from './preHookFunctions/validation/addUserCheatSheetValidation';
import addSchoolClassValidation from './preHookFunctions/validation/addSchoolClassValidation';
import updateSchoolClassValidation from './preHookFunctions/validation/updateSchoolClassValidation';
import deleteSchoolValidation from './preHookFunctions/validation/deleteSchoolValidation';
import deleteSchoolClassValidation from './preHookFunctions/validation/deleteSchoolClassValidation';
import deleteCourseValidation from './preHookFunctions/validation/deleteCourseValidation';
import updateBatchValidation from './preHookFunctions/validation/updateBatchValidation';
import updateCampaignValidation from './preHookFunctions/validation/updateCampaignValidation';
import generateInviteCode from '../../../utils/generateInviteCode';
import deleteBatchValidation from './preHookFunctions/validation/deleteBatchValidation';
import addUserActivityComicStripDumpValidation from './preHookFunctions/validation/addUserActivityComicStripDumpValidation';
import userBlockBasedPracticeValidation from './preHookFunctions/validation/userBlockBasedPracticeValidation';
import userBlockBasedProjectValidation from './preHookFunctions/validation/userBlockBasedProjectValidation';
import addUserActivityBlockBasedProjectDumpValidation from './preHookFunctions/validation/addUserActivityBlockBasedProjectDumpValidation';
import addUserActivityBlockBasedPracticeDumpValidation
  from './preHookFunctions/validation/addUserActivityBlockBasedPracticeDumpValidation';
import addMentorProfileValidation from './preHookFunctions/validation/addMentorProfileValidation';
import deleteMentorMenteeSessionValidation from './preHookFunctions/validation/deleteMentorMenteeSessionValidation';
import addAuditQuestionValidation from './preHookFunctions/validation/addAuditQuestionValidation';
import addBDEProfileValidation from './preHookFunctions/validation/addBDEProfileValidation';
import addSalesExecutiveProfileValidation from './preHookFunctions/validation/addSalesExecutiveProfileValidation';
import addChapterValidation from './preHookFunctions/validation/addChapterValidation';
import updateChapterValidation from './preHookFunctions/validation/updateChapterValidation';
import addTopicValidation from './preHookFunctions/validation/addTopicValidation';
import updateTopicValidation from './preHookFunctions/validation/updateTopicValidation';
import deleteVideoValidation from './preHookFunctions/validation/deleteVideoValidation';
import deleteAssignmentQuestionValidation from './preHookFunctions/validation/deleteAssignmentQuestionValidation';
import deleteBlockBasedProjectValidation from './preHookFunctions/validation/deleteBlockBasedProjectValidation';
import addAssignmentQuestionValidation from './preHookFunctions/validation/addAssignmentQuestionValidation';
import updateAssignmentQuestionValidation from './preHookFunctions/validation/updateAssignmentQuestionValidation';
import updateLearningObjectiveValidation from './preHookFunctions/validation/updateLearningObjectiveValidation';
import addBlockBasedProjectValidation from './preHookFunctions/validation/addBlockBasedProjectValidation';
import updateBlockBasedProjectValidation from './preHookFunctions/validation/updateBlockBasedProjectValidation';

const prehook = async (input, mutationOrQueryName, context, params) => {
  switch (mutationOrQueryName) {
    case 'updateTopic': {
      // await isUniqueOrderField(params, mutationOrQueryName);
      await updateTopicValidation(params);
      return hook(input, mutationOrQueryName, 'PreHook');
    }

    case 'updateChapter': {
      await isUniqueOrderField(params, mutationOrQueryName);
      await updateChapterValidation(input, mutationOrQueryName, context, params);
      return hook(input, mutationOrQueryName, 'PreHook');
    }

    case 'addTopic': {
      // if (!get(params, 'chapterConnectId')) {
      //   throw new ConnectIdRequiredError({ data: { message: 'Chapter Id is required' } });
      // }
      // await isUniqueOrderField(params, mutationOrQueryName);
      await addTopicValidation(params);
      return hook(input, mutationOrQueryName, 'PreHook');
    }

    case 'addChapter': {
      if (!get(params, 'coursesConnectIds', []).length) {
        throw new ConnectIdRequiredError({ data: { message: 'Course Id is required' } });
      }
      await addChapterValidation(input, mutationOrQueryName, context, params);
      // await isUniqueOrderField(params, mutationOrQueryName);
      return hook(input, mutationOrQueryName, 'PreHook');
    }
    case 'addUser': {
      // validate username, phone, email and name and returns email or phone verified accordingly
      const verifiedData = await addUserValidation(input, context);
      Object.assign(input, verifiedData);
      return preUserDataValidation(input, mutationOrQueryName)
        .then((userData) => {
          if (userData) {
            throw new UserAlreadyExistsError();
          }
          return hook(input, mutationOrQueryName, 'PreHook');
        });
    }
    case 'setUserPassword': {
      return preUserDataValidation(input, mutationOrQueryName)
        .then((userData) => {
          if (!userData) {
            throw new DatabaseRecordNotFoundError();
          }

          // Only user with active and inactive status are allowed to set their password
          const { status, isSetPassword } = userData;
          switch (status) {
            case 'blocked':
              throw new BlockedOperationError();
            default:
          }

          if (isSetPassword) {
            throw new UserPasswordAlreadySetError();
          }
          return hook(input, mutationOrQueryName, 'PreHook');
        });
    }
    case 'resetUserPassword': {
      return preUserDataValidation(input, mutationOrQueryName)
        .then((userData) => {
          if (!userData) {
            throw new DatabaseRecordNotFoundError();
          }
          const { status, isSetPassword } = userData;

          // Only user with active and inactive status are allowed to reset their password
          switch (status) {
            case 'blocked':
              throw new BlockedOperationError();
            default:
          }

          if (!isSetPassword) {
            throw new UserPasswordNotSetError();
          }
          Object.assign(input, {
            password: userData.password,
          });
          return hook(input, mutationOrQueryName, 'PreHook');
        });
    }
    case 'tcirtSdrowssaPtes': {
      return preUserDataValidation(input, mutationOrQueryName)
        .then((userData) => {
          if (!userData) {
            throw new DatabaseRecordNotFoundError();
          }
          const { status } = userData;

          // Only user with active and inactive status are allowed to set/reset their password
          switch (status) {
            case 'blocked':
              throw new BlockedOperationError();
            default:
          }

          return hook(input, mutationOrQueryName, 'PreHook');
        });
    }
    case 'signupExistingUser': {
      return new Promise((resolve) => {
        const verifiedData = validateExistingUserInput(input);
        Object.assign(input, verifiedData);
        resolve(hook(input, mutationOrQueryName, 'PreHook'));
      });
    }
    case 'login': {
      // validates email or phone number
      const verifiedData = validateLogin(input);
      Object.assign(input, verifiedData);

      return hook(input, mutationOrQueryName, 'PreHook');
    }
    case 'updateUser': {
      // validate username, phone, email and name and returns email or phone verified accordingly
      const verifiedData = await updateUserValidation(params, context);
      Object.assign(input, verifiedData);
      return hook(input, mutationOrQueryName, 'PreHook');
    }
    case 'resendUserOTP': {
      const { currentUser } = context;
      const { status } = currentUser;
      switch (status) {
        case 'active':
          throw new AlreadyActiveUser();
        case 'blocked':
          throw new UnauthorizedOperationError();
        case 'inactive': {
          Object.assign(input, { status: BYPASS });
          return hook(input, mutationOrQueryName, 'PreHook');
        }
        default:
      }
      break;
    }
    /* eslint-enable no-fallthrough */
    case 'finishForgotPassword':
    case 'validateForgotPasswordOTP':
    case 'resendForgotPasswordOTP':
    case 'sendForgotPasswordOTP': {
      const newInput = validateForgotPassword(input);
      return hook(newInput, mutationOrQueryName, 'PreHook');
    }
    case 'sendForgotPasswordLink': {
      const newInput = validateForgotPassword(input);
      return hook(newInput, mutationOrQueryName, 'PreHook');
    }
    case 'addAppToken': {
      const { currentUser } = context;
      const authentication = ifAuthorized(context);

      const { name, type } = input;
      if (currentUser) {
        const { status } = currentUser;
        if (status && status !== 'active') {
          throw new UnauthorizedOperationError();
        }
      }

      return validateAppTokenInput(input, authentication)
        .then(() => {
          Object.assign(input, {
            token: createStaticAppToken(name, type),
          });
          return hook(input, mutationOrQueryName, 'PreHook');
        });
    }
    case 'deleteFile': {
      return isFileDeleteAllowed(params)
        .then((res) => {
          if (!res) {
            throw new FileUsageCountNotZeroError();
          }
          return hook(input, mutationOrQueryName, 'PreHook');
        });
    }
    case 'deleteChapter': {
      await deleteChapterValidation(params);
      break;
    }
    case 'deleteTopic': {
      await deleteTopicValidation(params);
      break;
    }
    case 'deleteLearningObjective': {
      await deleteLearningObjectiveValidation(params);
      break;
    }
    case 'deleteQuestionBank': {
      await deleteQuestionBankValidation(params);
      break;
    }
    case 'addUserCurrentTopicComponentStatus': {
      await addUserCurrentTopicComponentStatusValidation(params, context);
      break;
    }
    case 'updateUserCurrentTopicComponentStatus': {
      await updateUserCurrentTopicComponentStatusValidation(params, context);
      break;
    }
    case 'userCourseSyllabus': {
      await userCourseSyllabusMethod(context, params);
      break;
    }
    case 'addUserActivityVideoDump': {
      await addUserActivityVideoDumpValidation(params, mutationOrQueryName, context);
      return hook(input, mutationOrQueryName, 'PreHook');
    }
    case 'addUserActivityChatDump': {
      await addUserActivityChatDumpValidation(params, mutationOrQueryName, context);
      return hook(input, mutationOrQueryName, 'PreHook');
    }
    case 'addUserActivityPQDump': {
      await addUserActivityPQDumpValidation(params, mutationOrQueryName, context);
      return hook(input, mutationOrQueryName, 'PreHook');
    }
    case 'addUserActivityQuizDump': {
      await addUserActivityQuizDumpValidation(params, mutationOrQueryName, context);
      return hook(input, mutationOrQueryName, 'PreHook');
    }
    case 'userVideo': {
      await userVideoValidation(params, context);
      return hook(input, mutationOrQueryName, 'PreHook');
    }
    case 'userLearningObjective': {
      await userLearningObjectiveValidation(params, context);
      return hook(input, mutationOrQueryName, 'PreHook');
    }
    case 'userQuiz': {
      await userQuizValidation(params, context);
      return hook(input, mutationOrQueryName, 'PreHook');
    }
    case 'addLearningObjective': {
      await addLearningObjectiveValidation(params);
      break;
    }
    case 'userTopicJourney': {
      await userCourseSyllabusMethod(context, params);
      break;
    }
    case 'menteeCourseSyllabus': {
      await userCourseSyllabusMethod(context, params);
      break;
    }
    case 'userAssignment': {
      await userAssignmentValidation(params, context, mutationOrQueryName);
      return hook(input, mutationOrQueryName, 'PreHook');
    }
    case 'addUserActivityAssignmentDump': {
      await addUserActivityAssignmentDumpValidation(params, mutationOrQueryName, context);
      return hook(input, mutationOrQueryName, 'PreHook');
    }
    case 'addMenteeSession': {
      const { bookingDate } = input;
      const updatedDate = new Date(bookingDate);
      updatedDate.setHours(0, 0, 0, 0);

      const newInput = {
        ...input,
        bookingDate: updatedDate.toISOString(),
      };
      const newParams = {
        ...params,
        input: {
          ...newInput,
        },
      };
      await addMenteeSessionValidation(newParams, mutationOrQueryName, context);
      return hook(newParams.input, mutationOrQueryName, 'PreHook');
    }
    case 'updateMenteeSession': {
      const { bookingDate } = input;
      let newInput = {};
      let newParams = {};
      if (bookingDate) {
        const updatedDate = new Date(bookingDate);
        updatedDate.setHours(0, 0, 0, 0);

        newInput = {
          ...input,
          bookingDate: updatedDate.toISOString(),
        };
        newParams = {
          ...params,
          input: {
            ...newInput,
          },
        };
      } else {
        newInput = {
          ...input,
        };
        newParams = {
          ...params,
        };
      }
      await updateMenteeSessionValidation(newParams, mutationOrQueryName, context);
      return hook(newParams.input, mutationOrQueryName, 'PreHook');
    }
    case 'addMentorSession': {
      const { availabilityDate } = input;
      const updatedDate = new Date(availabilityDate);
      updatedDate.setHours(0, 0, 0, 0);

      const newInput = {
        ...input,
        availabilityDate: updatedDate.toISOString(),
      };
      const newParams = {
        ...params,
        input: {
          ...newInput,
        },
      };
      await addMentorSessionValidation(newParams, mutationOrQueryName, context);
      return hook(newParams.input, mutationOrQueryName, 'PreHook');
    }
    case 'updateMentorSession': {
      const availabilityDate = get(input, 'availabilityDate', '');
      let newParams = {};
      let newInput = {};
      if (availabilityDate) {
        const updatedDate = new Date(availabilityDate);
        updatedDate.setHours(0, 0, 0, 0);

        newInput = {
          ...input,
          availabilityDate: updatedDate.toISOString(),
        };
        newParams = {
          ...params,
          input: {
            ...newInput,
          },
        };
      } else {
        newInput = {
          ...input,
        };
        newParams = {
          ...params,
        };
      }
      await updateMentorSessionValidation(newParams, mutationOrQueryName, context);
      return hook(newParams.input, mutationOrQueryName, 'PreHook');
    }
    case 'deleteMentorSession': {
      await deleteMentorSessionValidation(params, mutationOrQueryName, context);
      return hook(input, mutationOrQueryName, 'PreHook');
    }
    case 'addMentorMenteeSession': {
      const { sessionStatus } = input;
      const newInput = {
        ...input,
      };
      switch (sessionStatus) {
        case 'started': {
          newInput.sessionStartDate = new Date().toISOString();
          break;
        }
        // commenting it for batch, as we can complete session if we shift a batch to a topic
        // case 'completed': {
        //   throw new CanNotCompleteSessionBeforeStartingError();
        // }
        default: {
          newInput.sessionAllotmentDate = new Date().toISOString();
          // temporary hack for backword compatibility
          newInput.sessionStartDate = new Date().toISOString();
        }
      }
      const newParams = {
        ...params,
        input: {
          ...newInput,
        },
      };
      await addMentorMenteeSessionValidation(newParams, mutationOrQueryName, context);

      return hook(newParams.input, mutationOrQueryName, 'PreHook');
    }
    case 'updateMentorMenteeSession': {
      const { sessionStatus } = input;
      const newInput = {
        ...input,
      };
      switch (sessionStatus) {
        case 'allotted': {
          newInput.sessionAllotmentDate = new Date().toISOString();
          // temporary hack for backword compatibility
          newInput.sessionStartDate = new Date().toISOString();
          break;
        }
        case 'started': {
          newInput.sessionStartDate = new Date().toISOString();
          break;
        }
        case 'completed': {
          newInput.sessionEndDate = new Date().toISOString();
          break;
        }
        default:
      }
      const newParams = {
        ...params,
        input: {
          ...newInput,
        },
      };
      await updateMentorMenteeSessionValidation(newParams, mutationOrQueryName, context);
      return hook(newParams.input, mutationOrQueryName, 'PreHook');
    }
    case 'addUserPaymentInstallment': {
      const { isPaymentRequested } = input;
      if (typeof isPaymentRequested === 'boolean' && isPaymentRequested) {
        // eslint-disable-next-line no-param-reassign
        input.lastPaymentRequestedDate = new Date().toISOString();
      }
      return hook(input, mutationOrQueryName, 'PreHook');
    }
    case 'updateUserPaymentInstallment': {
      const { isPaymentRequested } = input;
      if (typeof isPaymentRequested === 'boolean' && isPaymentRequested) {
        // eslint-disable-next-line no-param-reassign
        input.lastPaymentRequestedDate = new Date().toISOString();
      }
      return hook(input, mutationOrQueryName, 'PreHook');
    }
    case 'deleteMenteeSession': {
      await deleteMenteeSessionValidation(params, mutationOrQueryName, context);
      return hook(input, mutationOrQueryName, 'PreHook');
    }
    case 'addSalesOperation': {
      await addSalesOperationValidation(params, mutationOrQueryName, context);
      break;
    }
    case 'updateSalesOperation': {
      await updateSalesOperationValidation(params, mutationOrQueryName, context);
      break;
    }
    case 'updateStudentProfile': {
      await updateStudentProfileValidation(params, mutationOrQueryName, context);
      break;
    }
    case 'addNetPromoterScore': {
      await addNetPromoterScoreValidation(params, mutationOrQueryName, context);
      break;
    }
    case 'addBatchSession': {
      const { sessionStatus } = input;
      const newInput = {
        ...input,
      };
      switch (sessionStatus) {
        case 'started': {
          newInput.sessionStartDate = new Date().toISOString();
          break;
        }
        default: {
          newInput.sessionAllotmentDate = new Date().toISOString();
          // temporary hack for backword compatibility
          newInput.sessionStartDate = new Date().toISOString();
        }
      }
      const newParams = {
        ...params,
        input: {
          ...newInput,
        },
      };
      await addBatchSessionValidation(newParams, mutationOrQueryName, context);

      return hook(newParams.input, mutationOrQueryName, 'PreHook');
    }
    case 'updateBatchSession': {
      const sessionStatus = get(input, 'sessionStatus', '');
      const newInput = {
        ...input,
      };
      if (sessionStatus) {
        switch (sessionStatus) {
          case 'allotted': {
            newInput.sessionAllotmentDate = new Date().toISOString();
            // temporary hack for backword compatibility
            newInput.sessionStartDate = new Date().toISOString();
            break;
          }
          case 'started': {
            newInput.sessionStartDate = new Date().toISOString();
            break;
          }
          case 'completed': {
            newInput.sessionEndDate = new Date().toISOString();
            break;
          }
          default:
        }
      }
      const newParams = {
        ...params,
        input: {
          ...newInput,
        },
      };
      await updateBatchSessionValidation(newParams, mutationOrQueryName, context);
      return hook(newInput, mutationOrQueryName, 'PreHook');
    }
    case 'deleteBatchSession': {
      await deleteBatchSessionValidation(params, mutationOrQueryName, context);
      break;
    }
    case 'updateBatchCurrentComponentStatus': {
      await updateBatchCurrentComponentStatusValidation(params, mutationOrQueryName, context);
      break;
    }
    case 'deleteUserApprovedCodeTag': {
      await deleteUserApprovedCodeTagValidation(params, mutationOrQueryName, context);
      break;
    }
    case 'addBanner': {
      await addBannerValidation(params, mutationOrQueryName, context);
      break;
    }
    case 'updateBanner': {
      await updateBannerValidation(params, mutationOrQueryName, context);
      break;
    }
    case 'deleteBanner': {
      await deleteBannerValidation(params, mutationOrQueryName, context);
      break;
    }
    case 'deleteWorkbook': {
      await deleteWorkbookValidation(params, mutationOrQueryName, context);
      break;
    }
    case 'deleteProject': {
      await deleteProjectValidation(params, mutationOrQueryName, context);
      break;
    }
    case 'deleteCheatSheet': {
      await deleteCheatSheetValidation(params, mutationOrQueryName, context);
      break;
    }
    case 'updateUserSavedCode': {
      await updateUserSavedCodeValidation(params, mutationOrQueryName, context);
      break;
    }
    case 'updateUserApprovedCode': {
      await updateUserApprovedCodeValidation(params, mutationOrQueryName, context);
      break;
    }
    case 'updateDiscount': {
      await updateSchoolDiscountValidation(params, mutationOrQueryName, context);
      break;
    }
    case 'addProduct': {
      await addProductValidation(params, mutationOrQueryName, context);
      break;
    }
    case 'updateProduct': {
      await updateProductValidation(params, mutationOrQueryName, context);
      break;
    }
    case 'deleteProduct': {
      await deleteProductValidation(params, mutationOrQueryName, context);
      break;
    }
    case 'addUserCheatSheet': {
      await addUserCheatSheetValidation(params, mutationOrQueryName, context);
      break;
    }
    case 'addSchoolClass': {
      await addSchoolClassValidation(params, mutationOrQueryName, context);
      break;
    }
    case 'updateSchoolClass': {
      await updateSchoolClassValidation(params, mutationOrQueryName, context);
      break;
    }
    case 'deleteSchoolClass': {
      await deleteSchoolClassValidation(params, mutationOrQueryName, context);
      break;
    }
    case 'deleteSchool': {
      await deleteSchoolValidation(params, mutationOrQueryName, context);
      break;
    }
    case 'deleteCourse': {
      await deleteCourseValidation(params, mutationOrQueryName, context);
      break;
    }
    case 'updateBatch': {
      await updateBatchValidation(params, mutationOrQueryName, context);
      break;
    }
    case 'addCampaign': {
      return hook({ ...input, code: generateInviteCode(8) }, mutationOrQueryName, 'PreHook');
    }
    case 'updateCampaign': {
      await updateCampaignValidation(params, mutationOrQueryName, context);
      break;
    }
    case 'deleteBatch': {
      await deleteBatchValidation(params, mutationOrQueryName, context);
      break;
    }
    case 'addUserActivityComicStripDump': {
      await addUserActivityComicStripDumpValidation(params, mutationOrQueryName, context);
      break;
    }
    case 'userBlockBasedPractice': {
      await userBlockBasedPracticeValidation(params, context);
      return hook(input, mutationOrQueryName, 'PreHook');
    }
    case 'userBlockBasedProject': {
      await userBlockBasedProjectValidation(params, context);
      return hook(input, mutationOrQueryName, 'PreHook');
    }
    case 'addUserActivityBlockBasedProjectDump': {
      await addUserActivityBlockBasedProjectDumpValidation(params, mutationOrQueryName, context);
      break;
    }
    case 'addUserActivityBlockBasedPracticeDump': {
      await addUserActivityBlockBasedPracticeDumpValidation(params, mutationOrQueryName, context);
      break;
    }
    case 'addMentorProfile': {
      await addMentorProfileValidation(params, mutationOrQueryName, context);
      break;
    }
    case 'deleteMentorMenteeSession': {
      await deleteMentorMenteeSessionValidation(params, mutationOrQueryName, context);
      break;
    }
    case 'addAuditQuestion': {
      await addAuditQuestionValidation(params, mutationOrQueryName, context);
      break;
    }
    case 'addBDEProfile': {
      await addBDEProfileValidation(params, mutationOrQueryName, context);
      break;
    }
    case 'addSalesExecutiveProfile': {
      await addSalesExecutiveProfileValidation(params, mutationOrQueryName, context);
      break;
    }
    case 'deleteVideo': {
      await deleteVideoValidation(params, mutationOrQueryName, context);
      break;
    }
    case 'deleteAssignmentQuestion': {
      await deleteAssignmentQuestionValidation(params, mutationOrQueryName, context);
      break;
    }
    case 'deleteBlockBasedProject': {
      await deleteBlockBasedProjectValidation(params, mutationOrQueryName, context);
      break;
    }
    case 'addAssignmentQuestion': {
      await addAssignmentQuestionValidation(params, mutationOrQueryName, context);
      break;
    }
    case 'updateAssignmentQuestion': {
      await updateAssignmentQuestionValidation(params, mutationOrQueryName, context);
      break;
    }
    case 'updateLearningObjective': {
      await updateLearningObjectiveValidation(params, mutationOrQueryName, context);
      break;
    }
    case 'addBlockBasedProject': {
      await addBlockBasedProjectValidation(params, mutationOrQueryName, context);
      break;
    }
    case 'updateBlockBasedProject': {
      await updateBlockBasedProjectValidation(params, mutationOrQueryName, context);
      break;
    }
    case 'addSchool': {
      return hook({ ...input, schoolCampaignCode: generateInviteCode(8) }, mutationOrQueryName, 'PreHook');
    }
    default: {
      /* If context is not present then it means user is not authenticated and the
      user won't be able to make any db query
      */
      /* Queries are without input but they are not calling prehook function */
      if (input) {
        const { currentUser } = context;
        // Backend apps won't be having any decoded user
        if (currentUser) {
          const { status } = currentUser;
          // for rest of the operations user status need to be inctive state
          if (status && status !== 'active') {
            throw new UnauthorizedOperationError();
          }
        }
      }
    }
  }
  return hook(input, mutationOrQueryName, 'PreHook');
};
export { prehook };

import addMutationResolver from './add/add';
import deleteMutationResolver from './delete/delete';
import deleteMultipleMutationResolver from './delete/deleteMany';
import updateMutationResolver from './update/update';
import addRelationMutationResolver from './add/addRelation';
import removeRelationMutationResolver from './delete/removeRelation';
import signupMutationResolver from './user/signup';
import loginMutationResolver from './user/login';
import uploadFileResolver from './update/uploadFile';
import signupExistingUserMutationResolver from './user/signupExistingUser';
import validateUserOTPMutationResolver from './user/validateUserOTP';
import setUserPasswordMutationResolver from './setResetPassword/setUserPassword';
import setPasswordStrictMutationPromise from './setResetPassword/setPasswordStrict';
import resetUserPasswordMutationResolver from './setResetPassword/resetUserPassword';
import resendUserOTPResolver from './setResetPassword/resendUserOTP';
import sendForgotPasswordOTPMutationResolver from './forgotPassword/sendForgotPasswordOTP';
import validateForgotPasswordOTPMutationResolver from './forgotPassword/validateForgotPasswordOTP';
import finishForgotPasswordMutationResolver from './forgotPassword/finishForgotPassword';
import resendForgotPasswordOTPMutationResolver from './forgotPassword/resendForgotPasswordOTP';
import userCourseSyllabusMutationResolver from './userData/userCourseSyllabus';
import userTopicJourneyMutationResolver from './userData/userTopicJourney';
import userFirstAndLatestQuizReportMutationResolver from './userData/userFirstAndLatestQuizReport';
import skipVideoMutationResolver from './userData/skipVideo';
import userBadgeMutationResolver from './userData/userBadge';

export {
  addMutationResolver,
  updateMutationResolver,
  deleteMutationResolver,
  addRelationMutationResolver,
  removeRelationMutationResolver,
  signupMutationResolver,
  loginMutationResolver,
  uploadFileResolver,
  signupExistingUserMutationResolver,
  setUserPasswordMutationResolver,
  resetUserPasswordMutationResolver,
  validateUserOTPMutationResolver,
  resendUserOTPResolver,
  sendForgotPasswordOTPMutationResolver,
  validateForgotPasswordOTPMutationResolver,
  finishForgotPasswordMutationResolver,
  resendForgotPasswordOTPMutationResolver,
  setPasswordStrictMutationPromise,
  deleteMultipleMutationResolver,
  userCourseSyllabusMutationResolver,
  userTopicJourneyMutationResolver,
  userFirstAndLatestQuizReportMutationResolver,
  skipVideoMutationResolver,
  userBadgeMutationResolver,
};

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
import menteeCourseSyllabusMutationResolver from './userData/menteeCourseSyllabus';
import userTopicJourneyMutationResolver from './userData/userTopicJourney';
import userFirstAndLatestQuizReportMutationResolver from './userData/userFirstAndLatestQuizReport';
import skipVideoMutationResolver from './userData/skipVideo';
import skipPracticeQuestionMutationResolver from './userData/skipPracticeQuestion';
import userBadgeMutationResolver from './userData/userBadge';
import sendForgotPasswordLinkMutationResolver from './forgotPassword/sendForgotPasswordLink';
import resetPasswordFromForgotPasswordLinkMutationResolver from './forgotPassword/resetPasswordFromForgotPasswordLink';
import getUnlockedUserBadgeMutationResolver from './userData/getUnlockedUserBadge';
import getQuizReportMutationResolver from './userData/getQuizReport';
import parentChildSignUpMutationResolver from './user/parentChildSignUp';
import loginViaPasswordMutationResolver from './user/loginViaPassword';
import getPaymentRequestMutationResolver from './payment/getPaymentRequest';
import getPaymentResponseMutationResolver from './payment/getPaymentResponse';
import addBulkMentorSessionMutationResolver from './mentor/addBulkMentorSession';
import generateMentorPayoutReportMutationResolver from './mentor/generateMentorPayoutReport';
import bookB2B2CSlotsMutationResolver from './user/bookB2B2CSlots';
import rebookMenteeSessionMutationResolver from './user/rebookMenteeSession';
import sendCertificateInMailMutationResolver from './user/sendCertificateInMail';
import sendJourneySnapshotInMailMutationResolver from './user/sendJourneySnapshotInMail';
import generateCertificateMutationResolver from './pdf/generateCertificate';
import validateMagicLinkMutationResolver from './user/validateMagicLink';
import resetPasswordAndLoginMutationResolver from './setResetPassword/resetPasswordAndLogin';

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
  menteeCourseSyllabusMutationResolver,
  userTopicJourneyMutationResolver,
  userFirstAndLatestQuizReportMutationResolver,
  skipVideoMutationResolver,
  userBadgeMutationResolver,
  skipPracticeQuestionMutationResolver,
  sendForgotPasswordLinkMutationResolver,
  resetPasswordFromForgotPasswordLinkMutationResolver,
  getUnlockedUserBadgeMutationResolver,
  getQuizReportMutationResolver,
  parentChildSignUpMutationResolver,
  loginViaPasswordMutationResolver,
  getPaymentRequestMutationResolver,
  getPaymentResponseMutationResolver,
  addBulkMentorSessionMutationResolver,
  bookB2B2CSlotsMutationResolver,
  rebookMenteeSessionMutationResolver,
  sendCertificateInMailMutationResolver,
  sendJourneySnapshotInMailMutationResolver,
  generateCertificateMutationResolver,
  validateMagicLinkMutationResolver,
  resetPasswordAndLoginMutationResolver,
  generateMentorPayoutReportMutationResolver,
};

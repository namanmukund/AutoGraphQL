import { get } from 'lodash';
import getMenteeInfo from './utils/getMenteeInfo';
import addSessionLog from './utils/addSessionLog';
import sendSessionCancellationMessage from './utils/sendSessionCancellationMessage';
import getSelectedSlotsStringArray from './utils/getSelectedSlotsStringArray';
import { TBA } from '../../../../constants';
/*
  - check if the user if from referral
  - check if the session is the first session
  - check if the referrer has not reached its limit
  - check if the session status is completed for the first time
 */

const deleteMentorMenteeSessionPostHookMethod = async (input, mutationName, context) => {
  const {
    currentUser,
    prevMentorMenteeSessionDoc,
    prevMenteeSessionDoc,
  } = context;
  const menteeSession = context.menteeSession;
  const userId = get(menteeSession, 'data.menteeSession.user.id');
  const userInfo = await getMenteeInfo(userId);
  const topicId = get(input, 'topic.typeId', '');
  const mentorSessionId = get(input, 'mentorSession.typeId', '');
  if (currentUser && currentUser.id) {
    // update session log entry
    const courseId = get(input, 'course.typeId', '');
    const clientId = get(userInfo, 'data.user.id', '');
    const sessionStatus = get(input, 'sessionStatus');
    const menteeSessionDoc = get(menteeSession, 'data.menteeSession', {});
    let bookingDate = '';
    let slotTimeStringArray = [];
    if (prevMenteeSessionDoc) {
      bookingDate = get(prevMenteeSessionDoc, 'bookingDate');
      slotTimeStringArray = getSelectedSlotsStringArray(prevMenteeSessionDoc);
    } else {
      bookingDate = get(menteeSessionDoc, 'bookingDate');
      slotTimeStringArray = getSelectedSlotsStringArray(menteeSessionDoc);
    }
    const batchCode = get(userInfo, 'data.user.studentProfile.batch.code', '');
    if (context.currentAppName !== TBA
      || (context.currentAppName === TBA && prevMenteeSessionDoc)) {
      const updateMentorMenteeSessionInput = {};
      updateMentorMenteeSessionInput.hasRescheduled = get(prevMentorMenteeSessionDoc, 'hasRescheduled', false);
      updateMentorMenteeSessionInput.rescheduledDate = get(prevMentorMenteeSessionDoc, 'rescheduledDate', false);
      updateMentorMenteeSessionInput.rescheduledDateProvided = get(prevMentorMenteeSessionDoc, 'rescheduledDateProvided', null);
      updateMentorMenteeSessionInput.isFeedbackSubmitted = get(prevMentorMenteeSessionDoc, 'isFeedbackSubmitted', false);
      updateMentorMenteeSessionInput.sessionCommentByMentor = get(prevMentorMenteeSessionDoc, 'sessionCommentByMentor', '');
      updateMentorMenteeSessionInput.otherTechnicalReason = get(prevMentorMenteeSessionDoc, 'otherTechnicalReason', '');
      updateMentorMenteeSessionInput.otherReasonForChallenges = get(prevMentorMenteeSessionDoc, 'otherReasonForChallenges', '');
      updateMentorMenteeSessionInput.languageBarrier = get(prevMentorMenteeSessionDoc, 'languageBarrier');
      updateMentorMenteeSessionInput.otherLanguageBarrier = get(prevMentorMenteeSessionDoc, 'otherLanguageBarrier', '');
      updateMentorMenteeSessionInput.sessionStartDate = get(prevMentorMenteeSessionDoc, 'sessionStartDate');
      updateMentorMenteeSessionInput.country = get(prevMentorMenteeSessionDoc, 'country');
      const booleanReasons = ['sessionNotConducted', 'didNotTurnUpInSession', 'didNotPickTheCall', 'internetIssue', 'zoomIssue', 'laptopIssue', 'chromeIssue', 'powerCut', 'notResponseAndDidNotTurnUp', 'turnedUpButLeftAbruptly', 'classDurationExceeded', 'webSiteLoadingIssue', 'videoNotLoading', 'logInOTPError', 'codePlaygroundIssue'];
      booleanReasons.forEach((reason) => {
        if (typeof prevMentorMenteeSessionDoc[reason] === 'boolean') {
          updateMentorMenteeSessionInput[reason] = prevMentorMenteeSessionDoc[reason];
        }
      });
      addSessionLog(bookingDate, slotTimeStringArray, clientId, topicId, currentUser, courseId, 'deleteMentorMenteeSession', batchCode, mentorSessionId, sessionStatus, updateMentorMenteeSessionInput);
    }

    const studentName = get(menteeSession, 'data.menteeSession.user.name');
    const parentName = get(menteeSession, 'data.menteeSession.user.studentProfile.parents[0].user.name');
    if (get(menteeSession, 'data.menteeSession.topic.order') === 1) {
      if (context.currentAppName !== TBA) {
        const parentNumber = `${get(
          menteeSession,
          'data.menteeSession.user.studentProfile.parents[0].user.phone.countryCode',
          '',
        )}-${get(
          menteeSession,
          'data.menteeSession.user.studentProfile.parents[0].user.phone.number',
          '',
        )}`;
        sendSessionCancellationMessage(mentorSessionId, bookingDate, slotTimeStringArray, studentName, parentName, parentNumber);
      }
    }
  }
};
export default deleteMentorMenteeSessionPostHookMethod;

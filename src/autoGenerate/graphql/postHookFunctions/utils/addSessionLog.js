import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const addSessionLogQuery = (bookingDate, slot, clientId, topicId, actionByUserId, courseId, action, batchCode, mentorId, sessionStatus, mentorAvailabilityDate, updateMentorMenteeSessionInput = {}) => `
  mutation{
    addSessionLog(
        ${clientId ? `clientConnectId:"${clientId}"` : ''}
        ${courseId ? `courseConnectId:"${courseId}"` : ''}
        ${mentorId ? `mentorConnectId:"${mentorId}"` : ''}
        topicConnectId: "${topicId}"
        actionByConnectId: "${actionByUserId}"
        input:{
          action: ${action}
          sessionDate: "${bookingDate}"
          ${slot}:true
          ${sessionStatus ? `sessionStatus: ${sessionStatus}` : ''}
          ${batchCode ? `batchCode: "${batchCode}"` : ''}
          ${mentorAvailabilityDate ? `mentorAvailabilityDate: "${mentorAvailabilityDate}"` : ''}
          ${updateMentorMenteeSessionInput.sessionStartDate ? `sessionStartDate: "${updateMentorMenteeSessionInput.sessionStartDate}"` : ''}
          ${updateMentorMenteeSessionInput.sessionEndDate ? `sessionEndDate: "${updateMentorMenteeSessionInput.sessionEndDate}"` : ''}
          ${updateMentorMenteeSessionInput.rescheduledDate ? `rescheduledDate: "${updateMentorMenteeSessionInput.rescheduledDate}"` : ''}
          ${updateMentorMenteeSessionInput.classMissedMessageStatus ? `classMissedMessageStatus: ${updateMentorMenteeSessionInput.classMissedMessageStatus}` : ''}
          ${updateMentorMenteeSessionInput.comment ? `comment: "${updateMentorMenteeSessionInput.comment}"` : ''}
          ${updateMentorMenteeSessionInput.otherReasonForReschedule ? `otherReasonForReschedule: "${updateMentorMenteeSessionInput.otherReasonForReschedule}"` : ''}
          ${updateMentorMenteeSessionInput.rating ? `rating: ${updateMentorMenteeSessionInput.rating}` : ''}
          ${updateMentorMenteeSessionInput.sessionRecordingLink ? `sessionRecordingLink: "${updateMentorMenteeSessionInput.sessionRecordingLink}"` : ''}
          ${updateMentorMenteeSessionInput.sessionCommentByMentor ? `sessionCommentByMentor: "${updateMentorMenteeSessionInput.sessionCommentByMentor}"` : ''}
          ${updateMentorMenteeSessionInput.source ? `source: ${updateMentorMenteeSessionInput.source}` : ''}
          ${updateMentorMenteeSessionInput.country ? `country: ${updateMentorMenteeSessionInput.country}` : ''}
          ${updateMentorMenteeSessionInput.leadStatus ? `leadStatus: ${updateMentorMenteeSessionInput.leadStatus}` : ''}
          ${updateMentorMenteeSessionInput.friendly || updateMentorMenteeSessionInput.friendly === false ? `friendly: ${updateMentorMenteeSessionInput.friendly}` : ''}
          ${updateMentorMenteeSessionInput.motivating || updateMentorMenteeSessionInput.motivating === false ? `motivating: ${updateMentorMenteeSessionInput.motivating}` : ''}
          ${updateMentorMenteeSessionInput.engaging || updateMentorMenteeSessionInput.engaging === false ? `engaging: ${updateMentorMenteeSessionInput.engaging}` : ''}
          ${updateMentorMenteeSessionInput.helping || updateMentorMenteeSessionInput.helping === false ? `helping: ${updateMentorMenteeSessionInput.helping}` : ''}
          ${updateMentorMenteeSessionInput.enthusiastic || updateMentorMenteeSessionInput.enthusiastic === false ? `enthusiastic: ${updateMentorMenteeSessionInput.enthusiastic}` : ''}
          ${updateMentorMenteeSessionInput.patient || updateMentorMenteeSessionInput.patient === false ? `patient: ${updateMentorMenteeSessionInput.patient}` : ''}
          ${updateMentorMenteeSessionInput.conceptsPerfectlyExplained || updateMentorMenteeSessionInput.conceptsPerfectlyExplained === false ? `conceptsPerfectlyExplained: ${updateMentorMenteeSessionInput.conceptsPerfectlyExplained}` : ''}
          ${updateMentorMenteeSessionInput.distracted || updateMentorMenteeSessionInput.distracted === false ? `distracted: ${updateMentorMenteeSessionInput.distracted}` : ''}
          ${updateMentorMenteeSessionInput.rude || updateMentorMenteeSessionInput.rude === false ? `rude: ${updateMentorMenteeSessionInput.rude}` : ''}
          ${updateMentorMenteeSessionInput.slowPaced || updateMentorMenteeSessionInput.slowPaced === false ? `slowPaced: ${updateMentorMenteeSessionInput.slowPaced}` : ''}
          ${updateMentorMenteeSessionInput.fastPaced || updateMentorMenteeSessionInput.fastPaced === false ? `fastPaced: ${updateMentorMenteeSessionInput.fastPaced}` : ''}
          ${updateMentorMenteeSessionInput.notPunctual || updateMentorMenteeSessionInput.notPunctual === false ? `notPunctual: ${updateMentorMenteeSessionInput.notPunctual}` : ''}
          ${updateMentorMenteeSessionInput.average || updateMentorMenteeSessionInput.average === false ? `average: ${updateMentorMenteeSessionInput.average}` : ''}
          ${updateMentorMenteeSessionInput.boring || updateMentorMenteeSessionInput.boring === false ? `boring: ${updateMentorMenteeSessionInput.boring}` : ''}
          ${updateMentorMenteeSessionInput.poorExplanation || updateMentorMenteeSessionInput.poorExplanation === false ? `poorExplanation: ${updateMentorMenteeSessionInput.poorExplanation}` : ''}
          ${updateMentorMenteeSessionInput.averageExplanation || updateMentorMenteeSessionInput.averageExplanation === false ? `averageExplanation: ${updateMentorMenteeSessionInput.averageExplanation}` : ''}
          ${updateMentorMenteeSessionInput.sendSessionLink || updateMentorMenteeSessionInput.sendSessionLink === false ? `sendSessionLink: ${updateMentorMenteeSessionInput.sendSessionLink}` : ''}
          ${updateMentorMenteeSessionInput.didNotPickTheCall || updateMentorMenteeSessionInput.didNotPickTheCall === false ? `didNotPickTheCall: ${updateMentorMenteeSessionInput.didNotPickTheCall}` : ''}
          ${updateMentorMenteeSessionInput.sessionNotConducted || updateMentorMenteeSessionInput.sessionNotConducted === false ? `sessionNotConducted: ${updateMentorMenteeSessionInput.sessionNotConducted}` : ''}
          ${updateMentorMenteeSessionInput.didNotTurnUpInSession || updateMentorMenteeSessionInput.didNotTurnUpInSession === false ? `didNotTurnUpInSession: ${updateMentorMenteeSessionInput.didNotTurnUpInSession}` : ''}
          ${updateMentorMenteeSessionInput.hasRescheduled || updateMentorMenteeSessionInput.hasRescheduled === false ? `hasRescheduled: ${updateMentorMenteeSessionInput.hasRescheduled}` : ''}
          ${updateMentorMenteeSessionInput.rescheduledDateProvided || updateMentorMenteeSessionInput.rescheduledDateProvided === false ? `rescheduledDateProvided: ${updateMentorMenteeSessionInput.rescheduledDateProvided}` : ''}
          ${updateMentorMenteeSessionInput.internetIssue || updateMentorMenteeSessionInput.internetIssue === false ? `internetIssue: ${updateMentorMenteeSessionInput.internetIssue}` : ''}
          ${updateMentorMenteeSessionInput.zoomIssue || updateMentorMenteeSessionInput.zoomIssue === false ? `zoomIssue: ${updateMentorMenteeSessionInput.zoomIssue}` : ''}
          ${updateMentorMenteeSessionInput.laptopIssue || updateMentorMenteeSessionInput.laptopIssue === false ? `laptopIssue: ${updateMentorMenteeSessionInput.laptopIssue}` : ''}
          ${updateMentorMenteeSessionInput.chromeIssue || updateMentorMenteeSessionInput.chromeIssue === false ? `chromeIssue: ${updateMentorMenteeSessionInput.chromeIssue}` : ''}
          ${updateMentorMenteeSessionInput.classDurationExceeded || updateMentorMenteeSessionInput.classDurationExceeded === false ? `classDurationExceeded: ${updateMentorMenteeSessionInput.classDurationExceeded}` : ''}
          ${updateMentorMenteeSessionInput.webSiteLoadingIssue || updateMentorMenteeSessionInput.webSiteLoadingIssue === false ? `webSiteLoadingIssue: ${updateMentorMenteeSessionInput.webSiteLoadingIssue}` : ''}
          ${updateMentorMenteeSessionInput.videoNotLoading || updateMentorMenteeSessionInput.videoNotLoading === false ? `videoNotLoading: ${updateMentorMenteeSessionInput.videoNotLoading}` : ''}
          ${updateMentorMenteeSessionInput.codePlaygroundIssue || updateMentorMenteeSessionInput.codePlaygroundIssue === false ? `codePlaygroundIssue: ${updateMentorMenteeSessionInput.codePlaygroundIssue}` : ''}
          ${updateMentorMenteeSessionInput.logInOTPError || updateMentorMenteeSessionInput.logInOTPError === false ? `logInOTPError: ${updateMentorMenteeSessionInput.logInOTPError}` : ''}
          ${updateMentorMenteeSessionInput.notResponseAndDidNotTurnUp || updateMentorMenteeSessionInput.notResponseAndDidNotTurnUp === false ? `notResponseAndDidNotTurnUp: ${updateMentorMenteeSessionInput.notResponseAndDidNotTurnUp}` : ''}
          ${updateMentorMenteeSessionInput.notResponseAndDidNotTurnUp || updateMentorMenteeSessionInput.notResponseAndDidNotTurnUp === false ? `notResponseAndDidNotTurnUp: ${updateMentorMenteeSessionInput.notResponseAndDidNotTurnUp}` : ''}
          ${updateMentorMenteeSessionInput.turnedUpButLeftAbruptly || updateMentorMenteeSessionInput.turnedUpButLeftAbruptly === false ? `turnedUpButLeftAbruptly: ${updateMentorMenteeSessionInput.turnedUpButLeftAbruptly}` : ''}
          ${updateMentorMenteeSessionInput.leadNotVerifiedProperly || updateMentorMenteeSessionInput.leadNotVerifiedProperly === false ? `leadNotVerifiedProperly: ${updateMentorMenteeSessionInput.leadNotVerifiedProperly}` : ''}
          ${updateMentorMenteeSessionInput.otherReasonForReschedule || updateMentorMenteeSessionInput.otherReasonForReschedule === false ? `otherReasonForReschedule: ${updateMentorMenteeSessionInput.otherReasonForReschedule}` : ''}
        }
    ){
      id
    }
  }
`;

// query to get mentor Sessions
const getMentorSession = (mentorSessionId) => `query{
  mentorSession(id: "${mentorSessionId}"){
    id
    availabilityDate
    user{
      id
    }
  }
}
  `;

// query to get topic
const getTopic = (topicId) => `query{
  topic(id: "${topicId}"){
    id
    order
  }
}
  `;

const addSessionLog = async (
  bookingDate, slotTimeStringArray, clientId, topicId, currentUser, courseId, action, batchCode, mentorSessionId, sessionStatus, updateMentorMenteeSessionInput,
) => {
  const slot = slotTimeStringArray && slotTimeStringArray.length ? slotTimeStringArray[0] : '';
  const actionByUserId = currentUser && currentUser.id;
  let mentorId = '';
  let mentorAvailabilityDate = '';
  let topicOrder = 0;
  if (mentorSessionId) {
    const getMentorSessionRes = await callLocalGraphqlApi(
      getMentorSession(
        mentorSessionId,
      ),
    );
    mentorId = get(getMentorSessionRes, 'data.mentorSession.user.id', '');
    mentorAvailabilityDate = get(getMentorSessionRes, 'data.mentorSession.availabilityDate', '');
  }

  if (topicId) {
    const getTopicRes = await callLocalGraphqlApi(
      getTopic(
        topicId,
      ),
    );
    topicOrder = get(getTopicRes, 'data.topic.order', 0);
  }
  if (topicOrder === 1 && actionByUserId) {
    callLocalGraphqlApi(addSessionLogQuery(
      bookingDate, slot, clientId, topicId, actionByUserId, courseId, action, batchCode, mentorId, sessionStatus, mentorAvailabilityDate, updateMentorMenteeSessionInput,
    ));
  }
};

export default addSessionLog;

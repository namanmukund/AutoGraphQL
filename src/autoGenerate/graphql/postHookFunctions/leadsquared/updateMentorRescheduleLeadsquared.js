import { get } from 'lodash';
import moment from 'moment';
import updateLeadsquared from '../../../../../services/leadsquared/updateLeadSquared';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const mentorMenteeSessionQuery = (userId) => `{
  mentorMenteeSession(id: "${userId}") {
    id
    internetIssue
    zoomIssue
    laptopIssue
    chromeIssue
    powerCut
    notResponseAndDidNotTurnUp
    turnedUpButLeftAbruptly
    leadNotVerifiedProperly
    otherReasonForReschedule
    hasRescheduled
    sessionCommentByMentor
    rescheduledDate
  }
}`;

const updateMentorRescheduleLeadsquared = async (userInfo, input, params) => {
  const phoneNumber = get(userInfo, 'data.user.studentProfile.parents[0].user.phone.number');
  const mentorMenteeSession = await callLocalGraphqlApi(mentorMenteeSessionQuery(get(params, 'id')));
  const data = get(mentorMenteeSession, 'data.mentorMenteeSession');
  const reasons = [
    {
      tag: get(data, 'internetIssue', false),
      text: 'Slow/Unstable Internet',
    },
    {
      tag: get(data, 'zoomIssue', false),
      text: 'Zoom Not Installed',
    },
    {
      tag: get(data, 'laptopIssue', false),
      text: 'No Laptop - Joined Over The Phone',
    },
    {
      tag: get(data, 'chromeIssue', false),
      text: 'Google Chrome Not Installed',
    },
    {
      tag: get(data, 'powerCut', false),
      text: 'Power Cut',
    },
    {
      tag: get(data, 'notResponseAndDidNotTurnUp', false),
      text: 'No Response And Didn\'t Turn Up',
    },
    {
      tag: get(data, 'turnedUpButLeftAbruptly', false),
      text: 'Turned Up But Left Abruptly',
    },
    {
      tag: get(data, 'leadNotVerifiedProperly', false),
      text: 'Lead Is Not Verified Properly',
    },
    {
      tag: get(data, 'otherReasonForReschedule', false),
      text: 'Other Reasons',
    },
  ];
  const leadSquaredInput = {
    Phone: phoneNumber,
    mx_Mentor_Rescheduled: get(data, 'hasRescheduled') ? 'Yes' : 'No',
    mx_Mentor_Rescheduled_Reason: reasons.filter((reason) => reason.tag).map((reason) => reason.text).join(' , '),
    mx_mentor_session_comment: get(data, 'sessionCommentByMentor', ''),
  };
  if (get(params, 'input.hasRescheduled')) {
    leadSquaredInput.mx_Lead_Status = 'Reschedule';
    leadSquaredInput.ProspectStage = 'Reschedule';
  }
  if (get(params, 'input.rescheduledDate')) {
    leadSquaredInput.mx_Mentor_Rescheduled_Date_Time = moment(get(data, 'rescheduledDate')).utc().format('YYYY-MM-DD HH:mm:ss');
  }
  updateLeadsquared(leadSquaredInput);
};

export default updateMentorRescheduleLeadsquared;

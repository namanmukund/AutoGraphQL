import { get } from 'lodash';
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

  const leadSquaredInput = {
    Phone: phoneNumber,
  };

  let leadStatus = '';

  if (get(params, 'input.sessionStatus') === 'completed') {
    leadSquaredInput.mx_Student_turn_up = 'Yes';
    leadStatus = 'Demo Completed';
  }

  if (get(params, 'input.didNotTurnUpInSession')) {
    leadSquaredInput.mx_Student_turn_up = 'No';
    leadStatus = 'No turnup';
  }

  if (get(params, 'input.didNotPickTheCall')) {
    leadSquaredInput.mx_Mentor_Call_Picked = 'No';
  }
  if (get(params, 'input.hasRescheduled')) {
    leadSquaredInput.mx_Interested_to_reschedule = 'Yes';
  } else {
    leadSquaredInput.mx_Interested_to_reschedule = 'Yes';
  }

  // leadSquaredInput.mx_Mentor_Rescheduled_Reason = ['Internet issue', 'laptop not available'];

  if (!get(params, 'input.didNotTurnUpInSession', true) && !get(params, 'input.hasRescheduled')) {
    leadStatus = 'Reachout to Reschedule';
  }

  if (get(params, 'input.hasRescheduled') && !get(params, 'input.rescheduledDateProvided')) {
    leadStatus = 'Interested to Reschedule';
  }

  if (get(params, 'input.hasRescheduled') && !get(params, 'input.rescheduledDateProvided')) {
    leadStatus = 'Reachout to Reschedule';
  }

  updateLeadsquared(leadSquaredInput, false, {
    ActivityEvent: 103,
    Fields: [
      {
        SchemaName: 'Status',
        Value: leadStatus,
      },
    ],
  });
};

export default updateMentorRescheduleLeadsquared;

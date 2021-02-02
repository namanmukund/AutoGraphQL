import { get } from 'lodash';
import { MENTEE } from '../../../../constants/roles';
import updateReferrerCreditsPostSessionOrUserPayment from './utils/updateReferrerCreditsPostSessionOrUserPayment';
import referralCredits from '../../../../constants/referralCredits';
import { TRIAL_TAKEN_FROM_REFERRAL } from '../../../../constants/userCreditReason';
import getMenteeInfo from './utils/getMenteeInfo';
import updateClassMissedMessageStatus from './utils/updateClassMissedMessageStatus';
import { setSessionCompletedLeadsquared, updateMentorRescheduleLeadsquared } from './leadsquared';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import sendWhatsAppTemplateMessage from '../../utils/sendWhatsAppTemplateMessage';
import transactionalMessageBody from '../../../../constants/transactionalMessageBody';
import sendTransactionalEmail from '../resolvers/utils/sendTransactionalEmail';

/*
  - check if the user if from referral
  - check if the session is the first session
  - check if the referrer has not reached its limit
  - check if the session status is completed for the first time
 */

const userIdQuery = (menteeSessionId) => `{
  menteeSession(id: "${menteeSessionId}") {
    id
    user {
      id
      name
      country
      studentProfile {
        parents {
          user {
            id
            name
            email
            phone {
              number
              countryCode
            }
          }
        }
      }
    }
  }
}`;

const allowedRoles = [MENTEE];
const updateMentorMenteeSessionPostHookMethod = async (input, mutationName, context, params) => {
  const { currentUser, previousDocument: { sessionStatus: prevSessionStatus, topic } } = context;

  const menteeSession = await callLocalGraphqlApi(userIdQuery(get(input, 'menteeSession.typeId')));
  const userId = get(menteeSession, 'data.menteeSession.user.id');
  const userInfo = await getMenteeInfo(userId);

  const hasRescheduled = get(input, 'hasRescheduled');
  const notResponseAndDidNotTurnUp = get(input, 'notResponseAndDidNotTurnUp');
  const classMissedMessageStatus = get(input, 'classMissedMessageStatus');
  const country = get(menteeSession, 'data.menteeSession.user.country') ? get(menteeSession, 'data.menteeSession.user.country') : 'india';
  const studentName = get(menteeSession, 'data.menteeSession.user.name');
  const parentName = get(menteeSession, 'data.menteeSession.user.studentProfile.parents[0].user.name');
  const parentEmail = get(menteeSession, 'data.menteeSession.user.studentProfile.parents[0].user.email', '');
  const phoneNumber = get(menteeSession, 'data.menteeSession.user.studentProfile.parents[0].user.phone.countryCode', '').replace('+', '')
    + get(menteeSession, 'data.menteeSession.user.studentProfile.parents[0].user.phone.number');
  if (hasRescheduled && notResponseAndDidNotTurnUp && classMissedMessageStatus === 'pending' && country !== 'india') {
    const parameters = [
      {
        name: 'student_name',
        value: studentName,
      },
      {
        name: 'parent_name',
        value: parentName,
      },
    ];
    sendWhatsAppTemplateMessage(phoneNumber, transactionalMessageBody.sessionMissed.whatsAppTemplate, parentName, parameters);
    sendTransactionalEmail({ parentName, name: studentName, parentEmail }, transactionalMessageBody.sessionMissed, country);
    updateClassMissedMessageStatus(input.id, 'sent');
  }

  if (currentUser && currentUser.id) {
    if (
      (prevSessionStatus !== 'completed' && (input && input.sessionStatus && input.sessionStatus === 'completed'))
      && allowedRoles.includes(currentUser.role)
      && topic.order === 1
    ) {
      const variables = {
        input: {
          trialTaken: true,
          trialTakenDate: new Date().toISOString(),
        },
      };
      const { trialTaken } = referralCredits[1];
      await updateReferrerCreditsPostSessionOrUserPayment(currentUser.id, trialTaken, context, variables, TRIAL_TAKEN_FROM_REFERRAL);
      // set session completed on leadsquared
    }

    if (
      (prevSessionStatus !== 'completed' && (input && input.sessionStatus && input.sessionStatus === 'completed'))
      && topic.order === 1
    ) {
      setSessionCompletedLeadsquared(userInfo);
    }

    if (input && Object.keys(input).includes('hasRescheduled') && topic.order === 1) {
      updateMentorRescheduleLeadsquared(userInfo, input, params);
    }
  }
};
export default updateMentorMenteeSessionPostHookMethod;

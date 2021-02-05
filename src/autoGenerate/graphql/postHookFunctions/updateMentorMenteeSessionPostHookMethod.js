import { get } from 'lodash';
import { MENTOR_RATING_AUDIT_THRESHOLD } from '../../../../constants';
import { MENTEE } from '../../../../constants/roles';
import updateReferrerCreditsPostSessionOrUserPayment from './utils/updateReferrerCreditsPostSessionOrUserPayment';
import referralCredits from '../../../../constants/referralCredits';
import { TRIAL_TAKEN_FROM_REFERRAL } from '../../../../constants/userCreditReason';
import getMenteeInfo from './utils/getMenteeInfo';
import updateClassMissedMessageStatus from './utils/updateClassMissedMessageStatus';
import addMentorMenteeSessionAudit from './utils/addMentorMenteeSessionAudit';
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
    const inputMentorRating = get(input, 'rating');
    const inputDistracted = get(input, 'distracted', false);
    const inputRude = get(input, 'rude', false);
    const inputSlowPaced = get(input, 'slowPaced', false);
    const inputFastPaced = get(input, 'fastPaced', false);
    const inputNotPunctual = get(input, 'notPunctual', false);
    const inputAverage = get(input, 'average', false);
    const inputBoring = get(input, 'boring', false);
    const inputPoorExplanation = get(input, 'poorExplanation', false);
    const inputAverageExplanation = get(input, 'averageExplanation', false);
    const inputIsAudit = get(input, 'isAudit', false);
    const prevIsAudit = get(context, 'previousDocument.isAudit', false);
    const mentorMenteeSessionId = get(context, 'previousDocument.id', '');

    if ((inputIsAudit && prevIsAudit !== inputIsAudit)
      || (inputMentorRating && inputMentorRating < MENTOR_RATING_AUDIT_THRESHOLD)
      || inputDistracted || inputRude || inputSlowPaced || inputFastPaced || inputNotPunctual
      || inputAverage || inputBoring || inputPoorExplanation || inputAverageExplanation) {
      addMentorMenteeSessionAudit(mentorMenteeSessionId);
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

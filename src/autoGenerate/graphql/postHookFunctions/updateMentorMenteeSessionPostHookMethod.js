import { get } from 'lodash';
import moment from 'moment';
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
// import sendWhatsAppTemplateMessage from '../../utils/sendWhatsAppTemplateMessage';
import transactionalMessageBody from '../../../../constants/transactionalMessageBody';
import sendTransactionalEmail from '../resolvers/utils/sendTransactionalEmail';
import updateUserPaymentPlanMutation from './utils/updateUserPaymentPlanMutation';
import getSessionVelocityStatus from './utils/getSessionVelocityStatus';
import getSelectedSlotsTime from '../preHookFunctions/validation/utils/getSelectedSlotsTime';
import getSlotTimesInString from '../../../../utils/getSlotTimesInString';
import addRescheduledSlot from './utils/addRescheduledSlot';
/*
  - check if the user if from referral
  - check if the session is the first session
  - check if the referrer has not reached its limit
  - check if the session status is completed for the first time
 */

const userIdQuery = (menteeSessionId) => `{
  menteeSession(id: "${menteeSessionId}") {
    id
    bookingDate
    ${getSlotTimesInString()}
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

const mentorMenteeSessionsQuery = async (userId, orderBy = 'latest') => {
  let orderByString = '';
  if (orderBy === 'latest') {
    orderByString = 'orderBy:sessionStartDate_DESC';
  } else {
    orderByString = 'orderBy:sessionStartDate_ASC';
  }
  const query = `
query{
  mentorMenteeSessions(filter:{
    and:[
      {menteeSession_some:{user_some:{id:"${userId}"}}}
      {sessionStatus:completed}
    ]
  }, ${orderByString}, first:1){
    id
    sessionStartDate
    topic{
      id
      order
    }
  }
}
`;
  const res = await callLocalGraphqlApi(query);
  const data = get(res, 'data.mentorMenteeSessions[0]');
  return data;
};

const userPaymentPlanQuery = async (filterQuery) => {
  const query = `
    query{
      userPaymentPlans(filter:{and:[
        ${filterQuery}
    ]}) {
        id
        sessionsPerMonth
      }
    }
`;
  const res = await callLocalGraphqlApi(query);
  const data = get(res, 'data.userPaymentPlans[0]');
  return data;
};

const allowedRoles = [MENTEE];
const updateMentorMenteeSessionPostHookMethod = async (input, mutationName, context, params) => {
  const { currentUser, previousDocument: { sessionStatus: prevSessionStatus, topic, menteeSession: prevMenteeSession } } = context;
  const { sessionStartDate } = input;
  const menteeSession = await callLocalGraphqlApi(userIdQuery(get(input, 'menteeSession.typeId')));
  const userId = get(menteeSession, 'data.menteeSession.user.id');
  const userInfo = await getMenteeInfo(userId);

  const oldSlotTimeArray = getSelectedSlotsTime(prevMenteeSession);
  const newSlotTimeArray = getSelectedSlotsTime(get(menteeSession, 'data.menteeSession', []));
  const oldBookingDate = get(prevMenteeSession, 'bookingDate', '');
  const newBookingDate = get(menteeSession, 'data.menteeSession.bookingDate', '');

  // adding Rescheduled Slot async if we get changed mentee session
  // constructing fromDate and fromSLot from values in previous document
  // constructing toDate and toSLot from values in updated document
  if (newSlotTimeArray && newSlotTimeArray.length && oldSlotTimeArray && oldSlotTimeArray.length && oldBookingDate && newBookingDate) {
    const fromDate = new Date(oldBookingDate).toISOString();
    const toDate = new Date(newBookingDate).toISOString();
    const fromSlot = `slot${oldSlotTimeArray[0]}`;
    const toSlot = `slot${newSlotTimeArray[0]}`;
    // adding only in case the slots or date passed in input is different from that is already there in db
    if ((fromDate !== toDate) || (fromSlot !== toSlot)) {
      addRescheduledSlot(fromDate, fromSlot, toDate, toSlot, '', input.id);
    }
  }

  const hasRescheduled = get(input, 'hasRescheduled');
  const notResponseAndDidNotTurnUp = get(input, 'notResponseAndDidNotTurnUp');
  const classMissedMessageStatus = get(input, 'classMissedMessageStatus');
  const country = get(menteeSession, 'data.menteeSession.user.country') ? get(menteeSession, 'data.menteeSession.user.country') : 'india';
  const studentName = get(menteeSession, 'data.menteeSession.user.name');
  const parentName = get(menteeSession, 'data.menteeSession.user.studentProfile.parents[0].user.name');
  const parentEmail = get(menteeSession, 'data.menteeSession.user.studentProfile.parents[0].user.email', '');
  // const phoneNumber = get(menteeSession, 'data.menteeSession.user.studentProfile.parents[0].user.phone.countryCode', '').replace('+', '')
  //   + get(menteeSession, 'data.menteeSession.user.studentProfile.parents[0].user.phone.number');
  if (hasRescheduled && notResponseAndDidNotTurnUp && classMissedMessageStatus === 'pending' && country !== 'india') {
    // const parameters = [
    //   {
    //     name: 'student_name',
    //     value: studentName,
    //   },
    //   {
    //     name: 'parent_name',
    //     value: parentName,
    //   },
    // ];
    // sendWhatsAppTemplateMessage(phoneNumber, transactionalMessageBody.sessionMissed.whatsAppTemplate, parentName, parameters);
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
  /** Update MenteeMentorSession If Session Completed  */
  if (prevSessionStatus === 'completed' || get(input, 'sessionStatus') === 'completed') {
    const menteeId = get(menteeSession, 'data.menteeSession.user.id');
    const userPaymentPlanData = await userPaymentPlanQuery(`{user_some:{id:"${menteeId}"}}`);
    if (userPaymentPlanData && userPaymentPlanData.id) {
      const updateObject = {};
      if (sessionStartDate) {
        updateObject.lastSessionOn = new Date(sessionStartDate).toISOString();
        const lastTopicOrder = get(topic, 'order');
        if (lastTopicOrder > 1) {
          const mmsFirstData = await mentorMenteeSessionsQuery(menteeId, 'first');
          const diffInDays = moment(sessionStartDate).diff(mmsFirstData.sessionStartDate, 'days');
          if (diffInDays) {
            updateObject.avgDaysPerSession = Math.round(diffInDays / lastTopicOrder);
            updateObject.sessionVelocityStatus = getSessionVelocityStatus(userPaymentPlanData.sessionsPerMonth, updateObject.avgDaysPerSession);
          }
        }
      }
      await updateUserPaymentPlanMutation(get(userPaymentPlanData, 'id'), updateObject, get(topic, 'id'));
    }
  }
};
export default updateMentorMenteeSessionPostHookMethod;

import { get } from 'lodash';
import moment from 'moment';
import { auditType, MENTOR_RATING_AUDIT_THRESHOLD, OLD_COURSE_ID } from '../../../../constants';
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
import addSessionLog from './utils/addSessionLog';
import getSelectedSlotsStringArray from './utils/getSelectedSlotsStringArray';
import addSalesAudit from './utils/addSalesAudit';
import { fetchCourseData, sessionStartedStreaksFlow, submittedForReviewStreaksFlow } from './utils/homeworkStreakMethods';
import { log } from '../../../../utils';
import getTopicInfo from './utils/getTopicInfo';
import getCourseInfo from './utils/getCourseInfo';
import sendDemoCompletionCertificate from './utils/sendDemoCompletionCertificate';

const { postSales, demoWow } = auditType;
// import sendSessionCancellationMessage from './utils/sendSessionCancellationMessage';
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
    bookedBy
    user {
      id
      name
      country
      studentProfile {
        mentor {
          id
        }
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

const updateUserVerificationStatus = async (userId) => {
  const updateQuery = `mutation {
  updateUser(id: "${userId}", input: { verificationStatus: verified }) {
    id
  }
}
`;
  await callLocalGraphqlApi(updateQuery);
};

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
    mentorSession {
      user {
        name
        mentorProfile {
          salesExecutive {
            user {
              name
              email
            }
          }
        }
      }
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

const intersection = (arr1, arr2) => {
  // eslint-disable-next-line no-restricted-syntax
  for (const v of arr1) {
    if (arr2.includes(v)) {
      return true;
    }
  }
  return false;
};

const allowedRoles = [MENTEE];
const updateMentorMenteeSessionPostHookMethod = async (input, mutationName, context, params) => {
  const {
    currentUser, previousDocument: {
      sessionStatus: prevSessionStatus,
      isFeedbackSubmitted: prevIsFeedbackSubmitted,
      topic,
      menteeSession: prevMenteeSession,
      isSubmittedForReview: prevIsSubmittedForReview,
    },
  } = context;
  const { sessionStartDate, isFeedbackSubmitted } = input;
  const menteeSession = await callLocalGraphqlApi(userIdQuery(get(input, 'menteeSession.typeId')));
  const userId = get(menteeSession, 'data.menteeSession.user.id');
  const userInfo = await getMenteeInfo(userId);
  const topicInfo = await getTopicInfo(get(params, 'topicConnectId'));
  const courseInfo = await getCourseInfo(get(params, 'courseConnectId'));

  const oldSlotTimeArray = getSelectedSlotsTime(prevMenteeSession);
  const newSlotTimeArray = getSelectedSlotsTime(get(menteeSession, 'data.menteeSession', []));
  const oldBookingDate = get(prevMenteeSession, 'bookingDate', '');
  const newBookingDate = get(menteeSession, 'data.menteeSession.bookingDate', '');
  const courseId = get(input, 'course.typeId', '');
  const mentorChildId = get(menteeSession, 'data.menteeSession.user.studentProfile.mentor.id', null);

  if (
    (!prevIsFeedbackSubmitted && isFeedbackSubmitted)
    && topic.order === 1
  ) {
    // show not occur for mentor
    if (!mentorChildId) {
      sendDemoCompletionCertificate(userId, courseId);
    }
    // email send function or lead squared based function
  }

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

  const menteeId = get(menteeSession, 'data.menteeSession.user.id');
  const mmsFirstData = await mentorMenteeSessionsQuery(menteeId, 'first');

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
      !mentorChildId && (prevSessionStatus !== 'completed' && (input && input.sessionStatus && input.sessionStatus === 'completed'))
      && topic.order === 1
    ) {
      setSessionCompletedLeadsquared(
        userInfo,
        get(mmsFirstData, 'mentorSession.user.name'),
        get(mmsFirstData, 'mentorSession.user.mentorProfile.salesExecutive.user.name'),
        get(mmsFirstData, 'mentorSession.user.mentorProfile.salesExecutive.user.email'),
      );
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
    const prevIsPostSalesAudit = get(context, 'previousDocument.isPostSalesAudit', false);
    const isPostSalesAuditFromInput = get(context, 'isPostSalesAuditFromInput', false);
    const prevIsDemoWowAudit = get(context, 'previousDocument.isDemoWowAudit', false);
    const isDemoWowAuditFromInput = get(input, 'isDemoWowAudit', false);

    if ((inputIsAudit && prevIsAudit !== inputIsAudit)
      || (inputMentorRating && inputMentorRating < MENTOR_RATING_AUDIT_THRESHOLD)
      || inputDistracted || inputRude || inputSlowPaced || inputFastPaced || inputNotPunctual
      || inputAverage || inputBoring || inputPoorExplanation || inputAverageExplanation) {
      addMentorMenteeSessionAudit(mentorMenteeSessionId, get(topic, 'order'));
    }

    if (isPostSalesAuditFromInput && prevIsPostSalesAudit === false) {
      addSalesAudit({ mentorMenteeSessionId, auditType: postSales });
    }

    if (isDemoWowAuditFromInput && prevIsDemoWowAudit === false) {
      addSalesAudit({ mentorMenteeSessionId, auditType: demoWow });
    }

    if (!mentorChildId && input && intersection(['hasRescheduled', 'sessionStatus', 'didNotPickTheCall', 'didNotTurnUpInSession', 'sessionNotConducted'], Object.keys(input)) && topic.order === 1) {
      updateMentorRescheduleLeadsquared(userInfo, input, params);
    }

    // update session log entry
    const clientId = get(userInfo, 'data.user.id', '');
    const topicId = topic && topic.id;
    const sessionStatus = get(input, 'sessionStatus');
    const menteeSessionDoc = get(menteeSession, 'data.menteeSession', {});
    const { bookingDate, ...slots } = menteeSessionDoc;
    const slotTimeStringArray = getSelectedSlotsStringArray(slots);

    // if mentorSession is updated at a later stage, send comms
    if (!mentorChildId && context.hasMentorSessionChanged && context.mentorSessionConnectId) {
      await extractMentorMenteeSessionAndSendMessage(bookingDate, slotTimeStringArray, context.mentorSessionConnectId, userInfo, topicInfo, input.id, courseInfo);
    }
    const mentorSessionId = get(input, 'mentorSession.typeId');
    const batchCode = get(userInfo, 'data.user.studentProfile.batch.code', '');
    // adding logs when menteeSession is changed or mentorSession is changed or status is changed
    addSessionLog(bookingDate, slotTimeStringArray, clientId, topicId, currentUser, courseId, 'updateMentorMenteeSession', batchCode, mentorSessionId, sessionStatus, input);
  }

  if (context.hasMenteeSessionChanged || context.hasMentorSessionChanged) {
    // sendSessionCancellationMessage(get(context, 'mentorSessionConnectId'), oldBookingDate, [`slot${get(oldSlotTimeArray, '0')}`], studentName, parentName);
  }
  /** Update MenteeMentorSession If Session Completed  */
  if (prevSessionStatus === 'completed' || get(input, 'sessionStatus') === 'completed') {
    const userPaymentPlanData = await userPaymentPlanQuery(`{user_some:{id:"${menteeId}"}}`);
    if (get(menteeSession, 'data.menteeSession.bookedBy') === 'leadPartner'
      && get(userInfo, 'data.user.verificationStatus') !== 'verified') {
      updateUserVerificationStatus(userId);
    }
    if (userPaymentPlanData && userPaymentPlanData.id) {
      const updateObject = {};
      if (sessionStartDate) {
        updateObject.lastSessionOn = new Date(sessionStartDate).toISOString();
        const lastTopicOrder = get(topic, 'order');
        if (lastTopicOrder > 1) {
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
  /**
   * Homework Streaks Implementation
   */
  const courseTypeId = get(input, 'course.typeId', '');
  const courseData = await fetchCourseData(courseTypeId);
  const topics = get(courseData, 'topics', []);
  const filteredTopics = topics.filter((topicObj) => {
    if (courseTypeId !== OLD_COURSE_ID) {
      let isHomeworkVisible = false;
      const topicComponentRuleDoc = get(topicObj, 'topicComponentRule', []);
      topicComponentRuleDoc.forEach((rule) => {
        if (rule && (['homeworkAssignment', 'quiz', 'homeworkPractice'].includes(get(rule, 'componentName')))) {
          isHomeworkVisible = true;
        }
      });
      return isHomeworkVisible;
    }
    return true;
  });
  /**
   * Updating streaks if user has submitted homework for review.
   */
  if (!mentorChildId && (prevIsSubmittedForReview === false) && (get(input, 'isSubmittedForReview') === true) && filteredTopics.length) {
    log('.............Homework Streaks Review Flow Started');
    submittedForReviewStreaksFlow(filteredTopics, userId, courseTypeId, context, topic.id);
  }
  /**
   * Updating streaks if user/mentor has started next session.
   */
  if (!mentorChildId && (prevSessionStatus === 'allotted') && (get(input, 'sessionStatus') === 'started') && filteredTopics.length) {
    log('.............Homework Streaks Session Flow Started');
    sessionStartedStreaksFlow(filteredTopics, userId, courseTypeId, context, topic.id);
  }
};
export default updateMentorMenteeSessionPostHookMethod;

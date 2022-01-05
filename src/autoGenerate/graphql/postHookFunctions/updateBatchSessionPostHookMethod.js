import { get } from 'lodash';
import moment from 'moment';
import {
  batchType,
  GLOBAL_COURSE_TITLE,
  PUBLISHED,
  sessionStatus,
  auditType as auditTypeValues,
  sessionType as sessionTypeValue,
} from '../../../../constants';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import updateBatchCurrentComponentStatus from './utils/updateBatchCurrentComponentStatus';
import addMentorMenteeSessionForBatch from '../../utils/addMentorMenteeSessionForBatch';
// import getSelectedSlotsTime from '../preHookFunctions/validation/utils/getSelectedSlotsTime';
import extractBatchSessionAndSendB2BC from './utils/extractBatchSessionAndSendB2BC';
import addToSchedule from '../../../../utils/scheduleJobs/addToSchedule';
import getSelectedSlotsStringArray from './utils/getSelectedSlotsStringArray';
import addSessionLog from './utils/addSessionLog';
import sendWhatsAppTemplateMessage from '../../utils/sendWhatsAppTemplateMessage';
import getSlotLabel from '../../../../utils/getSlotLabel';
import { DatabaseRecordNotFoundError } from '../../../../constants/errors';
import addSalesAudit from './utils/addSalesAudit';
import isTrialSession from '../resolvers/utils/isTrialSession';
import { getMentorProfileFromMentorSession } from './utils/getMentorProfile';
import mentorAvailabilitySlotOperation from './utils/mentorAvailabilitySlotOperation';

// query to get chapters and topics belomngin to a course
const getCourseQuery = () => `
    query{
      courses(filter:{
        and:[
          {title: "${GLOBAL_COURSE_TITLE}"},
          {status: ${PUBLISHED}}
        ]
      }){
        id
      }
    }
  `;

// query to get chapters and topics belomngin to a course
const getBatchQuery = (batchId) => `
    query{
      batch(id:"${batchId}"){
        id
        code
        type
        students{
          user{
            id
            source
            name
          }
          parents {
            user {
              email
            }
          }
        }
        currentComponent{
          id
          latestSessionStatus
          currentTopic{
            id
          }
        }
      }
    }
  `;

// query to get published topic list
const nextTopicQuery = (courseId) => `
  query{
  topics(
    filter:{
      and:[
        {
          status: ${PUBLISHED}
        }
        {
          courses_some:{
            ${courseId ? `id: "${courseId}"` : `title: "${GLOBAL_COURSE_TITLE}"`}
          }
        }
      ]
    }
    orderBy:order_ASC,
  ){
    id
  }
}
  `;

// fetch mentor Sessions
// const fetchMentorSessions = (bookingDate, mentorId, sessionType) => `
//   {
//     mentorSessions(filter: {and: [{availabilityDate: "${bookingDate}"}, {user_some: {id: "${mentorId}"}}, {sessionType: ${sessionType}}]}) {
//       id
//       availabilityDate
//       slot0
//       slot1
//       slot2
//       slot3
//       slot4
//       slot5
//       slot6
//       slot7
//       slot8
//       slot9
//       slot10
//       slot11
//       slot12
//       slot13
//       slot14
//       slot15
//       slot16
//       slot17
//       slot18
//       slot19
//       slot20
//       slot21
//       slot22
//       slot23
//     }
//   }
//   `;

// update mentor Session
// const updateMentorSession = (mentorSessionId, sessionsBookingDateInDB, slot) => `
//   mutation{
//     updateMentorSession(id: "${mentorSessionId}", input: {
//       availabilityDate:"${sessionsBookingDateInDB}",
//       ${slot}: true
//     }) {
//       id
//     }
//   }
//   `;

// add mentor Session
// const addMentorSession = (mentorUserId, courseId, sessionsBookingDateInDB, slot, sessionType) => `
//   mutation {
//     addMentorSession(
//       userConnectId: "${mentorUserId}",
//       courseConnectId: "${courseId}",
//     input:{
//       availabilityDate:"${sessionsBookingDateInDB}",
//       ${slot}: true,
//       sessionType: ${sessionType}
//     }
//     ) {
//       id
//     }
//   }
//   `;

// update batch Session
// const updateBatchSession = (batchSessionId, mentorSessionId) => `
//   mutation{
//     updateBatchSession(id: "${batchSessionId}", mentorSessionConnectId: "${mentorSessionId}") {
//       id
//     }
//   }
//   `;

const getMentor = async (mentorSessionId) => {
  const mentorSession = await callLocalGraphqlApi(`{
    mentorSession(id: "${mentorSessionId}") {
      user {
        id
        phone {
          countryCode
          number
        }
        mentorProfile {
          sessionLink
          googleMeetLink
        }
      }
    }
  }`);
  return get(mentorSession, 'data.mentorSession.user', {});
};

const batchSessionQuery = (id) => `{
  batchSession(id: "${id}") {
    id
    course {
      title
    }
    batch {
      code
      type
      school {
        name
      }
      allottedMentor {
        phone {
          countryCode
          number
        }
      }
    }
  }
}`;
/*
  Post hook of addBatchSession
*/
const updateBatchSessionPostHookMethod = async (input, params, mutationName, context) => {
  const { sessionStatus: sessionStatusFromInput, ...slots } = input;
  const slotTimeStringArray = getSelectedSlotsStringArray(slots);
  const mentorSessionId = get(input, 'mentorSession.typeId');
  const {
    batchSessionId,
    inputSlotTimeArray,
    slotTimeArray,
    topicId,
    batchId,
    bookingDate,
    mentorSessionConnectId,
    prevMentor,
    bookingDateFromInput,
    currentUser,
    prevSessionStatus,
    prevIsAudit,
    batchTopicOrder,
    batchTypeValue,
  } = context;
  let courseId = get(context, 'courseId');
  /*
  get Course Id
  */
  if (!courseId) {
    const courseResult = await callLocalGraphqlApi(getCourseQuery());
    const course = get(courseResult, 'data.courses');
    if (course.length <= 0) {
      throw new DatabaseRecordNotFoundError({
        data: {
          error: 'Published course is not present with title as python from component addBatchPostHookMethod',
        },
      });
    }
    courseId = course[0].id;
  }

  // if mentorSessionConnectId is not present in batch session, then we need t create mentor session on basis of
  // allotted mentor in batch
  const finalMentorSessionId = mentorSessionId;
  // if (!mentorSessionId && allottedMentorId) {
  //   let sessionType = 'batch';
  //   if (batchTypeValue === 'b2b2c' && batchTopicOrder === 1) {
  //     sessionType = 'trial';
  //   }
  //   const { bookingDate: sessionsBookingDateInDB, ...slotsInDB } = input;
  //   const slotTimeInDBArray = getSelectedSlotsTime(slotsInDB);
  //   const mentorSessionsRes = await callLocalGraphqlApi(fetchMentorSessions(sessionsBookingDateInDB, allottedMentorId, sessionType));
  //   const mentorSession = get(mentorSessionsRes, 'data.mentorSessions[0]');
  //   if (mentorSession && mentorSession.id) {
  //     const { id: mentorSessionIdOfAllottedMentor, ...slotsInMentorSession } = mentorSession;
  //     finalMentorSessionId = mentorSessionIdOfAllottedMentor;
  //     const slotsInMentorSessionArray = getSelectedSlotsTime(slotsInMentorSession);
  //     if (slotTimeInDBArray && slotTimeInDBArray.length && slotsInMentorSessionArray && slotsInMentorSessionArray.length && slotTimeInDBArray[0] !== slotsInMentorSessionArray[0]) {
  //       await callLocalGraphqlApi(updateMentorSession(mentorSessionIdOfAllottedMentor, sessionsBookingDateInDB, `slot${slotTimeInDBArray[0]}`));
  //     }
  //   } else {
  //     const addMentorSessionRes = await callLocalGraphqlApi(addMentorSession(allottedMentorId, courseId, sessionsBookingDateInDB, `slot${slotTimeInDBArray[0]}`, sessionType));
  //     finalMentorSessionId = get(addMentorSessionRes, 'data.addMentorSession.id');
  //   }
  //   await callLocalGraphqlApi(updateBatchSession(batchSessionId, finalMentorSessionId));
  // }

  const isTrial = await isTrialSession(get(input, 'topic.typeId'));
  const batchResult = await callLocalGraphqlApi(getBatchQuery(batchId));
  if (isTrial) {
    const mentorProfile = await getMentorProfileFromMentorSession(finalMentorSessionId);
    await mentorAvailabilitySlotOperation({
      slotTimeStringArray,
      date: get(input, 'bookingDate'),
      mutationName,
      sessionType: sessionTypeValue.trial,
      sessionId: batchSessionId,
      mentorProfileId: get(mentorProfile, 'user.mentorProfile.id'),
      prevMentorAvailabilitySlot: get(input, 'mentorAvailabilitySlot.typeId'),
      batchType: get(batchResult, 'data.batch.type'),
    });
  }

  if (topicId) {
    /*
      get batch info
    */
    const batchInfo = get(batchResult, 'data.batch');
    const students = batchInfo && batchInfo.students;
    const currentComponent = batchInfo && batchInfo.currentComponent;
    const code = batchInfo && batchInfo.code;
    const batchCurrentComponentId = currentComponent && currentComponent.id;
    const currentComponentTopicId = get(currentComponent, 'currentTopic.id');
    // logic to change current component status if topic is completed
    if (batchCurrentComponentId && sessionStatusFromInput && topicId === currentComponentTopicId) {
      if (sessionStatusFromInput === sessionStatus.completed) {
        /*
        We are getting published topics list through this query.
        Then we will get next published topic
        */

        const nextTopicQueryRes = await callLocalGraphqlApi(nextTopicQuery(courseId));
        const topicsList = get(nextTopicQueryRes, 'data.topics');

        let currentTopicIndex;
        topicsList.forEach((topic, index) => {
          if (topic.id === topicId) {
            currentTopicIndex = index;
          }
        });
        let nextTopicId = '';
        if (currentTopicIndex + 1 < topicsList.length) {
          nextTopicId = topicsList[currentTopicIndex + 1].id;
        }
        if (nextTopicId) {
          context.shouldUpdateMentorMentee = false;
          await updateBatchCurrentComponentStatus(
            batchCurrentComponentId,
            sessionStatus.allotted,
            nextTopicId,
            context,
          );
        } else {
          context.shouldUpdateMentorMentee = false;
          await updateBatchCurrentComponentStatus(
            batchCurrentComponentId,
            sessionStatusFromInput,
            null,
            context,
          );
        }
        const postCarnivalFeedbackDate = moment().add(1, 'hour').toDate();
        addToSchedule('postCarnivalMail', postCarnivalFeedbackDate, { batchSessionId });
      } else {
        context.shouldUpdateMentorMentee = false;
        await updateBatchCurrentComponentStatus(
          batchCurrentComponentId,
          sessionStatusFromInput,
          null,
          context,
        );
      }
    }
    // console.log('bookingDate before if', bookingDate);
    // console.log('bookingDateFromInput before if', bookingDateFromInput);
    const bookingDateFromInputParsed = new Date(bookingDateFromInput);
    // console.log('bookingDateFromInputParsed', bookingDateFromInputParsed);

    const newStudentsArray = get(context, 'inputSlot.attendance.pushMany', []);
    // call addMentorMenteeSessionFor batch to create mentorMenteesession for each student in batch
    // this should only happen if we are changing sessionStatus or bookingDateFromInput
    if ((sessionStatusFromInput && sessionStatusFromInput !== sessionStatus.allotted) || bookingDateFromInput || mentorSessionId !== mentorSessionConnectId) {
      // console.log('bookingDate', bookingDate);
      // console.log('bookingDateFromInput', bookingDateFromInput);
      // console.log('slotTimeArray', slotTimeArray);
      // console.log('inputSlotTimeArray', inputSlotTimeArray);
      let toUpdateMenteeSession = false;
      if (
        (bookingDate && bookingDateFromInput && bookingDate.getTime() !== bookingDateFromInputParsed.getTime())
        || ((slotTimeArray.length > 0 && inputSlotTimeArray.length > 0) && get(slotTimeArray, '0') !== get(inputSlotTimeArray, '0'))
      ) {
        toUpdateMenteeSession = true;
      }
      if (((sessionStatusFromInput && sessionStatusFromInput !== sessionStatus.allotted) || bookingDateFromInput || newStudentsArray.length > 0)
        && !get(context, 'fromAddBatchSession', false)) {
        // eslint-disable-next-line no-restricted-syntax
        for (const student of students) {
          if (student.user && student.user.id) {
            addMentorMenteeSessionForBatch(
              context,
              student.user.id,
              '',
              topicId,
              bookingDateFromInput || bookingDate,
              inputSlotTimeArray[0] || slotTimeArray[0],
              mentorSessionConnectId || mentorSessionId,
              courseId,
              sessionStatusFromInput || sessionStatus.allotted,
              student.user.source,
              'updateBatchSession',
              toUpdateMenteeSession,
            );
          }
        }
      }

      // adding session logs when booking date or time is changed
      if (inputSlotTimeArray && inputSlotTimeArray.length && slotTimeArray && slotTimeArray.length) {
        const fromDate = new Date(bookingDate).toISOString();
        const toDate = bookingDateFromInput ? new Date(bookingDateFromInput).toISOString() : new Date(bookingDate).toISOString();
        const fromSlot = `slot${slotTimeArray[0]}`;
        const toSlot = `slot${inputSlotTimeArray[0]}`;
        // adding only in case the slots or date passed in input is different from that is already there in db
        if ((fromDate !== toDate) || (fromSlot !== toSlot)) {
          addSessionLog(bookingDateFromInput || bookingDate, slotTimeStringArray, '', topicId, currentUser, courseId, 'updateBatchSession', code, mentorSessionId, sessionStatusFromInput || sessionStatus.allotted, '', get(context, 'isManualSession', false));
        }
      }
      // adding logs also when mentorSession is changed or status is changed
      if (prevSessionStatus !== sessionStatusFromInput || (mentorSessionConnectId && (mentorSessionId !== mentorSessionConnectId))) {
        addSessionLog(bookingDate, slotTimeStringArray, '', topicId, currentUser, courseId, 'updateBatchSession', code, mentorSessionId, sessionStatusFromInput || sessionStatus.allotted, '', get(context, 'isManualSession', false));
      }
    }
    // adding logs also when mentorSession is changed or status is changed
    if (prevSessionStatus !== sessionStatusFromInput || (mentorSessionConnectId && (mentorSessionId !== mentorSessionConnectId))) {
      addSessionLog(bookingDate, slotTimeStringArray, '', topicId, currentUser, courseId, 'updateBatchSession', code, mentorSessionId, sessionStatusFromInput || sessionStatus.allotted, '', get(context, 'isManualSession', false));
    }
  }
  const students = get(context, 'inputSlot.attendance.pushMany', []).map((attendance) => get(attendance, 'studentConnectId'));
  extractBatchSessionAndSendB2BC(batchSessionId, students, context.isBookedByMentee, context.prevStudentsAttendanceCount === 0);
  if (mentorSessionConnectId) {
    const mentorUser = await getMentor(mentorSessionConnectId);
    const { id: mentorUserId, phone } = mentorUser;
    const prevMentorUserId = get(prevMentor, 'id');
    const prevMentorPhoneNumber = get(prevMentor, 'phone.countryCode', '').replace('+', '') + get(prevMentor, 'phone.number', '');

    // If mentor is changed
    if (mentorUserId !== prevMentorUserId) {
      // send prev mentor cancellation message
      const batchSessionRes = await callLocalGraphqlApi(batchSessionQuery(batchSessionId));
      if (get(batchSessionRes, 'data.batchSession.batch.type') !== batchType.b2b2c) return;
      const sessionDate = moment(bookingDate).format('dddd, Do MMMM');
      const sessionTime = getSlotLabel(slotTimeArray[0]).startTime;
      sendWhatsAppTemplateMessage(
        prevMentorPhoneNumber,
        'mentor_cancellation_b2b2c',
        prevMentorPhoneNumber,
        [
          {
            name: 'session_date',
            value: sessionDate,
          },
          {
            name: 'session_time',
            value: sessionTime,
          },
          {
            name: 'batch_code',
            value: get(batchSessionRes, 'data.batchSession.batch.code'),
          },
        ],
      );

      // send new mentor confirmation message
      const newMentorPhoneNumber = get(phone, 'countryCode', '').replace('+', '') + get(phone, 'number', '');
      const sessionLink = get(mentorUser, 'mentorProfile.googleMeetLink')
        ? get(mentorUser, 'mentorProfile.googleMeetLink')
        : get(mentorUser, 'mentorProfile.sessionMeetLink', '-') || '';
      sendWhatsAppTemplateMessage(
        newMentorPhoneNumber,
        'mentor_confirmation_b2b2c',
        newMentorPhoneNumber,
        [
          {
            name: 'course',
            value: get(batchSessionRes, 'data.batchSession.course.title'),
          },
          {
            name: 'batch_code',
            value: get(batchSessionRes, 'data.batchSession.batch.code'),
          },
          {
            name: 'school_name',
            value: get(batchSessionRes, 'data.batchSession.batch.school.name'),
          },
          {
            name: 'w_date',
            value: sessionDate,
          },
          {
            name: 'w_time',
            value: sessionTime,
          },
          {
            name: 'session_link',
            value: sessionLink,
          },
        ],
      );
      // schedule new mentor reminder
      const bookingDateTime = new Date(moment(bookingDate).toDate().setHours(slotTimeArray[0], 0, 0, 0)).toISOString();
      const hoursLeftForSession = Math.abs(moment(bookingDateTime).diff(moment(), 'hours'));
      if (hoursLeftForSession < 3) return;

      let mentorSessionReminderDateTime = moment(bookingDateTime).subtract(30, 'minutes').toDate();
      if (hoursLeftForSession >= 18) {
        mentorSessionReminderDateTime = moment(bookingDateTime).subtract(2, 'hours').toDate();
      }

      addToSchedule('mentorSessionNotificationB2B2C', mentorSessionReminderDateTime, {
        batchSessionId,
        courseName: get(batchSessionRes, 'data.batchSession.course.title'),
        batchCode: get(batchSessionRes, 'data.batchSession.batch.code'),
        schoolName: get(batchSessionRes, 'data.batchSession.batch.school.name'),
        sessionDate,
        sessionTime,
        sessionLink,
        mentorUserId,
        mentorPhoneNumber: newMentorPhoneNumber,
      });
    }
  }
  const isAuditFromInput = get(input, 'isAudit', false);
  if (isAuditFromInput && prevIsAudit === false) {
    addSalesAudit({
      batchSessionId,
      batchTopicOrder,
      batchTypeValue,
      auditType: auditTypeValues.mentor,
    });
  }
};
export default updateBatchSessionPostHookMethod;

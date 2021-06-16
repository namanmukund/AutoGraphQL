import { get } from 'lodash';
import moment from 'moment';
import {
  GLOBAL_COURSE_TITLE,
  PUBLISHED,
  sessionStatus,
} from '../../../../constants';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import updateBatchCurrentComponentStatus from './utils/updateBatchCurrentComponentStatus';
import addMentorMenteeSessionForBatch from '../../utils/addMentorMenteeSessionForBatch';
import addRescheduledSlot from './utils/addRescheduledSlot';
import getSelectedSlotsTime from '../preHookFunctions/validation/utils/getSelectedSlotsTime';
import extractBatchSessionAndSendB2B from './utils/extractBatchSessionAndSendB2B';
import addToSchedule from '../../../../utils/scheduleJobs/addToSchedule';

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
const fetchMentorSessions = (bookingDate, mentorId) => `
  {
    mentorSessions(filter: {and: [{availabilityDate: "${bookingDate}"}, {user_some: {id: "${mentorId}"}}, {sessionType: batch}]}) {
      id
      availabilityDate
      slot0
      slot1
      slot2
      slot3
      slot4
      slot5
      slot6
      slot7
      slot8
      slot9
      slot10
      slot11
      slot12
      slot13
      slot14
      slot15
      slot16
      slot17
      slot18
      slot19
      slot20
      slot21
      slot22
      slot23
    }
  }
  `;

// update mentor Session
const updateMentorSession = (mentorSessionId, sessionsBookingDateInDB, slot) => `
  mutation{
    updateMentorSession(id: "${mentorSessionId}", input: {
      availabilityDate:"${sessionsBookingDateInDB}",
      ${slot}: true,
      sessionType:batch
    }) {
      id
    }
  }
  `;

// add mentor Session
const addMentorSession = (mentorUserId, courseId, sessionsBookingDateInDB, slot) => `
  mutation {
    addMentorSession(
      userConnectId: "${mentorUserId}",
      courseConnectId: "${courseId}",
    input:{
      availabilityDate:"${sessionsBookingDateInDB}",
      ${slot}: true,
      sessionType:batch
    }
    ) {
      id
    }
  }
  `;

// update batch Session
const updateBatchSession = (batchSessionId, mentorSessionId) => `
  mutation{
    updateBatchSession(id: "${batchSessionId}", mentorSessionConnectId: "${mentorSessionId}") {
      id
    }
  }
  `;
/*
  Post hook of addBatchSession
*/
const updateBatchSessionPostHookMethod = async (input, params, mutationName, context) => {
  const { sessionStatus: sessionStatusFromInput } = input;
  const {
    batchSessionId,
    inputSlotTimeArray,
    slotTimeArray,
    topicId,
    batchId,
    bookingDate,
    mentorSessionConnectId,
    bookingDateFromInput,
    allottedMentorId,
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
  if (!mentorSessionConnectId && allottedMentorId) {
    let finalMentorSessionId = '';
    const { bookingDate: sessionsBookingDateInDB, ...slotsInDB } = input;
    const slotTimeInDBArray = getSelectedSlotsTime(slotsInDB);
    const mentorSessionsRes = await callLocalGraphqlApi(fetchMentorSessions(sessionsBookingDateInDB, allottedMentorId));
    const mentorSession = get(mentorSessionsRes, 'data.mentorSessions[0]');
    if (mentorSession && mentorSession.id) {
      const { id: mentorSessionId, ...slotsInMentorSession } = mentorSession;
      finalMentorSessionId = mentorSessionId;
      const slotsInMentorSessionArray = getSelectedSlotsTime(slotsInMentorSession);
      if (slotTimeInDBArray && slotTimeInDBArray.length && slotsInMentorSessionArray && slotsInMentorSessionArray.length && slotTimeInDBArray[0] !== slotsInMentorSessionArray[0]) {
        await callLocalGraphqlApi(updateMentorSession(mentorSessionId, sessionsBookingDateInDB, `slot${slotTimeInDBArray[0]}`));
      }
    } else {
      const addMentorSessionRes = await callLocalGraphqlApi(addMentorSession(allottedMentorId, courseId, sessionsBookingDateInDB, `slot${slotTimeInDBArray[0]}`));
      finalMentorSessionId = get(addMentorSessionRes, 'data.addMentorSession.id');
    }
    await callLocalGraphqlApi(updateBatchSession(batchSessionId, finalMentorSessionId));
  }

  // adding Rescheduled Slot async if we get slots in the input
  // constructing fromDate and fromSLot from values in previous document
  // constructing toDate and toSLot from values in input
  if (inputSlotTimeArray && inputSlotTimeArray.length && slotTimeArray && slotTimeArray.length) {
    const fromDate = new Date(bookingDate).toISOString();
    const toDate = bookingDateFromInput ? new Date(bookingDateFromInput).toISOString() : new Date(bookingDate).toISOString();
    const fromSlot = `slot${slotTimeArray[0]}`;
    const toSlot = `slot${inputSlotTimeArray[0]}`;
    // adding only in case the slots or date passed in input is different from that is already there in db
    if ((fromDate !== toDate) || (fromSlot !== toSlot)) {
      addRescheduledSlot(fromDate, fromSlot, toDate, toSlot, batchSessionId);
    }
  }

  if (topicId) {
    /*
      get batch info
    */
    const batchResult = await callLocalGraphqlApi(getBatchQuery(batchId));
    const batchInfo = get(batchResult, 'data.batch');
    const students = batchInfo && batchInfo.students;
    const currentComponent = batchInfo && batchInfo.currentComponent;
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
        await updateBatchCurrentComponentStatus(
          batchCurrentComponentId,
          sessionStatus.allotted,
          nextTopicId,
        );
        const postCarnivalFeedbackDate = moment().add(1, 'hour').toDate();
        addToSchedule('postCarnivalMail', postCarnivalFeedbackDate, { batchSessionId });
      } else {
        await updateBatchCurrentComponentStatus(
          batchCurrentComponentId,
          sessionStatusFromInput,
        );
      }
    }

    // call addMentorMenteeSessionFor batch to create mentorMenteesession for each student in batch
    // this should only happen if we are changing sessionStatus or bookingDateFromInput
    if ((sessionStatusFromInput && sessionStatusFromInput !== sessionStatus.allotted) || bookingDateFromInput) {
      // eslint-disable-next-line no-restricted-syntax
      for (const student of students) {
        if (student.user && student.user.id) {
          addMentorMenteeSessionForBatch(
            student.user.id,
            '',
            topicId,
            bookingDate,
            slotTimeArray[0],
            mentorSessionConnectId,
            courseId,
            sessionStatusFromInput || sessionStatus.allotted,
            student.user.source,
            'updateBatchSession',
          );
        }
      }
    }
  }
  const students = get(context, 'inputSlot.attendance.pushMany', []).map((attendance) => get(attendance, 'studentConnectId'));
  extractBatchSessionAndSendB2B(batchSessionId, students);
};

export default updateBatchSessionPostHookMethod;

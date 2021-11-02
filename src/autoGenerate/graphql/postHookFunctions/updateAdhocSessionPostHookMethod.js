import { get } from 'lodash';
import {
  GLOBAL_COURSE_TITLE,
  PUBLISHED,
} from '../../../../constants';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import getSelectedSlotsTime from '../preHookFunctions/validation/utils/getSelectedSlotsTime';
import { DatabaseRecordNotFoundError } from '../../../../constants/errors';

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

// fetch mentor Sessions
const fetchMentorSessions = (bookingDate, mentorId, sessionType) => `
  {
    mentorSessions(filter: {and: [{availabilityDate: "${bookingDate}"}, {user_some: {id: "${mentorId}"}}, {sessionType: ${sessionType}}]}) {
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
      ${slot}: true
    }) {
      id
    }
  }
  `;

// add mentor Session
const addMentorSession = (mentorUserId, courseId, sessionsBookingDateInDB, slot, sessionType) => `
  mutation {
    addMentorSession(
      userConnectId: "${mentorUserId}",
      courseConnectId: "${courseId}",
    input:{
      availabilityDate:"${sessionsBookingDateInDB}",
      ${slot}: true,
      sessionType: ${sessionType}
    }
    ) {
      id
    }
  }
  `;

// update adhoc Session
const updateAdhocSession = (adhocSessionId, mentorSessionId) => `
  mutation{
    updateAdhocSession(id: "${adhocSessionId}", mentorSessionConnectId: "${mentorSessionId}") {
      id
    }
  }
  `;

/*
  Post hook of updateAdhocSession
*/
const updateAdhocSessionPostHookMethod = async (input, params, mutationName, context) => {
  const mentorSessionId = get(input, 'mentorSession.typeId');
  const {
    adhocSessionId,
    allottedMentorId,
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
          error: 'Published course is not present with title as python from component updateAdhocSessionPostHookMethod',
        },
      });
    }
    courseId = course[0].id;
  }

  // if mentorSessionConnectId is not present in adhoc session, then we need to create mentor session on basis of
  // allotted mentor in batch
  if (!mentorSessionId && allottedMentorId) {
    let sessionType = 'batch';
    if (batchTypeValue === 'b2b2c' && batchTopicOrder === 1) {
      sessionType = 'trial';
    }
    let finalMentorSessionId = '';
    const { bookingDate: sessionsBookingDateInDB, ...slotsInDB } = input;
    const slotTimeInDBArray = getSelectedSlotsTime(slotsInDB);
    const mentorSessionsRes = await callLocalGraphqlApi(fetchMentorSessions(sessionsBookingDateInDB, allottedMentorId, sessionType));
    const mentorSession = get(mentorSessionsRes, 'data.mentorSessions[0]');
    if (mentorSession && mentorSession.id) {
      const { id: mentorSessionIdOfAllottedMentor, ...slotsInMentorSession } = mentorSession;
      finalMentorSessionId = mentorSessionIdOfAllottedMentor;
      const slotsInMentorSessionArray = getSelectedSlotsTime(slotsInMentorSession);
      if (slotTimeInDBArray && slotTimeInDBArray.length && slotsInMentorSessionArray && slotsInMentorSessionArray.length && slotTimeInDBArray[0] !== slotsInMentorSessionArray[0]) {
        await callLocalGraphqlApi(updateMentorSession(mentorSessionIdOfAllottedMentor, sessionsBookingDateInDB, `slot${slotTimeInDBArray[0]}`));
      }
    } else {
      const addMentorSessionRes = await callLocalGraphqlApi(addMentorSession(allottedMentorId, courseId, sessionsBookingDateInDB, `slot${slotTimeInDBArray[0]}`, sessionType));
      finalMentorSessionId = get(addMentorSessionRes, 'data.addMentorSession.id');
    }
    await callLocalGraphqlApi(updateAdhocSession(adhocSessionId, finalMentorSessionId));
  }

  // TODO : add audit for adhoc
  // const isAuditFromInput = get(input, 'isAudit', false);
  // if (isAuditFromInput && prevIsAudit === false) {
  //   addSalesAudit({
  //     adhocSessionId,
  //     batchTopicOrder,
  //     batchTypeValue,
  //     auditType: auditTypeValues.mentor,
  //   });
  // }
};
export default updateAdhocSessionPostHookMethod;

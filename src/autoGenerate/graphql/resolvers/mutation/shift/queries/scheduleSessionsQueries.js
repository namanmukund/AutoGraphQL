import { get } from 'lodash';
import getSlotTimeFields from '../../../../../../../graphqlSchema/core/functions/getSlotTimeFields';
import getWeekDaysFields from '../../../../../../../graphqlSchema/core/functions/getWeekDaysFields';
import callLocalGraphqlApi from '../../../../../../api/callLocalGraphqlApi';

const slotTimeFields = getSlotTimeFields('Boolean', true);
const weekDaysFields = getWeekDaysFields('Boolean', true);

const fetchBatch = async (batchId) => {
  const query = `
    query {
      batch(id: "${batchId}"){
        id
        allottedMentor {
          id
        }
        type
        timeTableRule {
          ${slotTimeFields}
          ${weekDaysFields}
          startDate
          endDate
        }
        school {
          timetableSchedule {
            id
            type
            startDate
            endDate
            ${slotTimeFields}
            ${weekDaysFields}
          }
        }
        timetableSchedule {
          id
          type
          startDate
          endDate
          ${slotTimeFields}
          ${weekDaysFields}
        }
      }
    }
  `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.batch', {});
};

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

const shiftBatchSessionsAfterGivenDate = (date, batchId, slots) => `
  mutation{
  shiftBatchSessionsAfterGivenDate(input:{
    date: "${date}"
    batchId: "${batchId}"
    ${slots}
  }){
    result
    error
  }
}
`;

const fetchBatchSession = async (batchSessionId) => {
  const query = `
  {
    batchSession(id: "${batchSessionId}") {
      batch {
        id
        allottedMentor{
          id
        }
        course{
          id
        }
        type
        school {
          timetableSchedule {
            id
            type
            startDate
            endDate
            ${slotTimeFields}
            ${weekDaysFields}
          }
        }
        timetableSchedule {
          id
          type
          startDate
          endDate
          ${slotTimeFields}
          ${weekDaysFields}
        }
      }
    }
  }
`;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.batchSession', {});
};

const fetchAdhocSession = async (adhocSessionId) => {
  const query = `
  {
    adhocSession(id: "${adhocSessionId}") {
      batch {
        id
        allottedMentor{
          id
        }
        type
        school {
          timetableSchedule {
            id
            type
            startDate
            endDate
            ${slotTimeFields}
            ${weekDaysFields}
          }
        }
        timetableSchedule {
          id
          type
          startDate
          endDate
          ${slotTimeFields}
          ${weekDaysFields}
        }
      }
    }
  }
`;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.adhocSession', {});
};

export {
  fetchBatch,
  fetchMentorSessions,
  updateMentorSession,
  addMentorSession,
  shiftBatchSessionsAfterGivenDate,
  fetchBatchSession,
  fetchAdhocSession,
};

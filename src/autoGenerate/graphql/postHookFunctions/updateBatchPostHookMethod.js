import { get } from 'lodash';
import extractSlotsFromInput from '../../../../utils/extractSlotsFromInput';
import getSelectedDays from './utils/getSelectedDays';
import getPossibleDates from '../../../../utils/getPossibleDates';
import {
  getTopics, getBatchSessions, createBatchSession, updateBatchSession,
} from './utils/updateBatchPostHookQueries';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import getSelectedSlotsTime from '../preHookFunctions/validation/utils/getSelectedSlotsTime';
import getSlotTimesInString from '../../../../utils/getSlotTimesInString';

// query to get all not completed batchSessions of a batch to update student
const getBatchSessionsQuery = (batchId) => `
    query{
    batchSessions(filter:{
      and:[
        {
          batch_some:{
            id: "${batchId}"
          }
        },
        {
          sessionStatus_in: [started, allotted]
        }
      ]
    }){
      id
      bookingDate
      ${getSlotTimesInString()}
    }
  }
  `;

// mutation to update batch sessions
const updateBatchSessionQuery = (
  batchSessionId, pushManyQuery,
) => `
  mutation{
    updateBatchSession(id:"${batchSessionId}",  input:{
      ${pushManyQuery}
    }){
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

// update mentors in mentor session
const updateNewMentorSessionInBatchSession = (batchSessionId, mentorSessionId) => `
  mutation{
  updateBatchSession(id: "${batchSessionId}",
  mentorSessionConnectId: "${mentorSessionId}"
  ){
    id
    mentorSession{
      id
    }
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

const getMentorSessionId = async (allottedMentorId, date, slotsInInput, courseId) => {
  let finalMentorSessionId = '';
  if (allottedMentorId) {
    const sentSlotsArray = getSelectedSlotsTime(slotsInInput);
    // eslint-disable-next-line no-await-in-loop
    const mentorSessionsRes = await callLocalGraphqlApi(fetchMentorSessions(date, allottedMentorId));
    const mentorSession = get(mentorSessionsRes, 'data.mentorSessions[0]');
    if (mentorSession && mentorSession.id) {
      const { id: mentorSessionId, ...slotsInMentorSession } = mentorSession;
      finalMentorSessionId = mentorSessionId;
      const slotsInMentorSessionArray = getSelectedSlotsTime(slotsInMentorSession);
      if (sentSlotsArray && sentSlotsArray.length && slotsInMentorSessionArray && slotsInMentorSessionArray.length && sentSlotsArray[0] !== slotsInMentorSessionArray[0]) {
        // eslint-disable-next-line no-await-in-loop
        await callLocalGraphqlApi(updateMentorSession(mentorSessionId, date, `slot${sentSlotsArray[0]}`));
      }
    } else {
      // eslint-disable-next-line no-await-in-loop
      const addMentorSessionRes = await callLocalGraphqlApi(addMentorSession(allottedMentorId, courseId, date, `slot${sentSlotsArray[0]}`));
      finalMentorSessionId = get(addMentorSessionRes, 'data.addMentorSession.id');
    }
  }
  return finalMentorSessionId;
};

const createBatchSessions = async (batchId, possibleDates, filteredSlots, slotsInInput, possibleSessionCount, topics, allottedMentorId, courseId) => {
  if (possibleDates.length <= possibleSessionCount) {
    // eslint-disable-next-line no-restricted-syntax
    for (const date of possibleDates) {
      // eslint-disable-next-line no-await-in-loop
      const finalMentorSessionId = await getMentorSessionId(allottedMentorId, date, slotsInInput, courseId);
      const index = possibleDates.indexOf(date);
      createBatchSession(batchId, date, filteredSlots, topics[index].id, finalMentorSessionId, courseId);
    }
  } else {
    for (let i = 0; i < possibleSessionCount; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const finalMentorSessionId = await getMentorSessionId(allottedMentorId, possibleDates[i], slotsInInput, courseId);
      createBatchSession(batchId, possibleDates[i].toISOString(), filteredSlots, topics[i].id, finalMentorSessionId, courseId);
    }
  }

  return true;
};

const updateAllottedBatchSessions = async (sessionsAllotted, possibleDates, filteredSlotsString, slotsInInput, allottedMentorId, courseId) => {
  let i = 0;
  /* eslint-disable array-callback-return */
  // eslint-disable-next-line no-restricted-syntax
  for (const session of sessionsAllotted) {
    // eslint-disable-next-line no-await-in-loop
    const finalMentorSessionId = await getMentorSessionId(allottedMentorId, possibleDates[i], slotsInInput, courseId);
    /* eslint-disable array-callback-return */
    const date = possibleDates[i].toISOString();
    updateBatchSession(session.id, filteredSlotsString, date, finalMentorSessionId, courseId);
    i += 1;
  }
};

// method to sort batchSessions
const sortBatchSessions = (batchSessions) => {
  const sessionsStartedOrCompleted = [];
  const sessionsAllotted = [];

  batchSessions.map((item) => {
    /* eslint-disable array-callback-return */
    if (item.sessionStatus === 'allotted') {
      sessionsAllotted.push(item);
    } else {
      sessionsStartedOrCompleted.push(item);
    }
  });

  return { sessionsStartedOrCompleted, sessionsAllotted };
};

/*
  Post hook of update batch
*/
/* eslint-disable no-unused-vars */
const updateBatchPostHookMethod = async (input, params, mutationName, context) => {
  const { id: batchId, studentsConnectIds, allottedMentorConnectId } = params;
  const mentorUserId = get(input, 'allottedMentor.typeId', '');
  const courseId = get(input, 'course.typeId', '');
  const timeTableRule = get(params, 'input.timeTableRule', null);
  /*
    -> Fetch total number of published topics (x), this will be the max possible number of batchSessions
    -> Fetch batchSessions that are either in the started or completed state (y)
    -> compare fields (fromDate, toDate, slot and weekdays) which are alredy stored in the database and which are passed as input
    -> make an array of Date, on which batchSessions are to be created (start > currentDate)(max = x-y), if beyond max throw interval too big error
    -> if there are no batchSessions in the Db, create batchSessions for all the dates in the date array
    -> if there are some batchSessions, update the remaining batchSessions with the new passed values and create batchSessions if necessary.
  */
  if (timeTableRule) {
    // topic count
    let topics = await getTopics(courseId);
    const topicCount = topics && topics.length;
    // batch sessions
    const batchSessions = await getBatchSessions(batchId);

    // start, end dates
    const days = getSelectedDays(timeTableRule);
    const startDate = new Date(timeTableRule.startDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(timeTableRule.endDate);
    endDate.setHours(0, 0, 0, 0);

    // slots passed in input
    const { ...slots } = timeTableRule;
    const { filteredSlotsString } = extractSlotsFromInput(slots);

    if (batchSessions && batchSessions.length) {
      // sorting the existing batch sessions into started/completed and allotted
      const {
        sessionsStartedOrCompleted,
        sessionsAllotted,
      } = sortBatchSessions(batchSessions);
      let possibleSessionCount = topicCount;
      if (sessionsStartedOrCompleted.length > 0) {
        // if there exists some started or completed sessions, don't count them, create/update sessions for the remaining
        possibleSessionCount -= sessionsStartedOrCompleted.length;
      }
      let possibleDates = getPossibleDates(startDate, endDate, days);
      // for the sessions which are still in the allotted state, update them
      const allottedSessionsCount = sessionsAllotted.length;
      if (allottedSessionsCount > 0) {
        possibleSessionCount -= allottedSessionsCount;
        updateAllottedBatchSessions(sessionsAllotted, possibleDates, filteredSlotsString, slots, mentorUserId, courseId);
      }
      if (possibleSessionCount > 0) {
        // all the remaining sessions have to be created
        const startFromIndex = allottedSessionsCount;
        possibleDates = possibleDates.slice(startFromIndex);
        const topicStartIndex = topicCount - possibleSessionCount;
        topics = topics.splice(topicStartIndex);
        createBatchSessions(batchId, possibleDates, filteredSlotsString, slots, possibleSessionCount, topics, mentorUserId, courseId);
      }
    } else {
      // if there are no exisiting batchSessions for the given batch id, create all of them
      const possibleSessionCount = topicCount;
      const possibleDates = getPossibleDates(startDate, endDate, days);
      createBatchSessions(batchId, possibleDates, filteredSlotsString, slots, possibleSessionCount, topics, mentorUserId, courseId);
    }
  } else if (allottedMentorConnectId) {
    const previouslyAllottedMentorId = get(context, 'previousDocument.allottedMentor.id', '');
    if (previouslyAllottedMentorId !== allottedMentorConnectId) {
      // fetch all the batch Sessions corresponding to given batch which are !completed state
      const notCompletedBatchSessionsResult = await callLocalGraphqlApi(getBatchSessionsQuery(batchId));
      const notCompletedBatchSessions = get(notCompletedBatchSessionsResult, 'data.batchSessions');
      notCompletedBatchSessions.forEach(async (batchSession) => {
        // we add or update mentor sessions of the new mentor based on the batch session dates
        const { id: batchSessionId, bookingDate, ...slots } = batchSession;
        const finalMentorSessionId = await getMentorSessionId(allottedMentorConnectId, bookingDate, slots, courseId);
        // update the new mentorSessionId in the batch Session
        callLocalGraphqlApi(updateNewMentorSessionInBatchSession(batchSessionId, finalMentorSessionId));
      });
    }
  }
  // while we are adding new students to a batch, adding those students to not completed batch Sessions
  if (studentsConnectIds && studentsConnectIds.length && batchId) {
    const notCompletedBatchSessionsResult = await callLocalGraphqlApi(getBatchSessionsQuery(batchId));
    const notCompletedBatchSessions = get(notCompletedBatchSessionsResult, 'data.batchSessions');
    notCompletedBatchSessions.forEach((batchSession) => {
      let pushManyQuery = 'attendance:{ pushMany: [';
      studentsConnectIds.forEach((studentsConnectId) => {
        pushManyQuery += `{studentConnectId: "${studentsConnectId}", 
                                               isPresent: false, 
                                               }, `;
      });
      pushManyQuery += ']}';
      // pushing new array of students in batch session
      callLocalGraphqlApi(updateBatchSessionQuery(
        batchSession.id,
        pushManyQuery,
      ), context);
    });
  }
};

export default updateBatchPostHookMethod;

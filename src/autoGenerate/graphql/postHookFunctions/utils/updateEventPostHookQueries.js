/* eslint-disable no-loop-func */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-unused-vars */
import { get } from 'lodash';
import moment from 'moment';
import { log } from '../../../../../utils';
import extractSlotsFromInput from '../../../../../utils/extractSlotsFromInput';
import getPossibleDates from '../../../../../utils/getPossibleDates';
import getSlotTimesInString from '../../../../../utils/getSlotTimesInString';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import getSelectedSlotsTime from '../../preHookFunctions/validation/utils/getSelectedSlotsTime';
import getSelectedDays from './getSelectedDays';

const getEventSessionForData = async (eventId) => {
  const query = `
    {
      eventSessions(filter: {
      and: [
        { event_some: { id: "${eventId}" } }
        { sessionDate: "${moment().startOf('day').toISOString()}" }
      ]
    }, orderBy:sessionDate_ASC){
        id
        sessionDate
        attendance{
          student{
            id
          }
        }
      }
    }
    `;
  const eventSessions = await callLocalGraphqlApi(query);
  return get(eventSessions, 'data.eventSessions', []);
};

// query to get eventSessions
const getEventSessions = async (eventId, sessionDatesFilter, fetchAttendance = false) => {
  const query = `
          {
            eventSessions(filter: {
            and: [
              { event_some: { id: "${eventId}" } }
              ${sessionDatesFilter ? `{
                or: [
                  ${sessionDatesFilter}
                ]
              }` : ''}
            ]
          }, orderBy:sessionDate_ASC){
              id
              sessionDate
              ${getSlotTimesInString()}
              ${fetchAttendance ? `attendance{
                student{
                  id
                }
              }` : ''}
            }
          }
          `;
  const eventSessions = await callLocalGraphqlApi(query);
  return get(eventSessions, 'data.eventSessions', []);
};

const createEventSession = async (eventId, date, slots) => {
  const query = `
          mutation{
            addEventSession(eventConnectId: "${eventId}",
            input:{
              sessionDate:"${date}",
              ${slots}
            }
            ){
              id
            }
          }
          `;
  await callLocalGraphqlApi(query);
  log(`Event Session created for date ${date}`);
  return true;
};

const deleteEventSession = async (eventSessionId) => {
  const deleteQuery = `mutation {
  deleteEventSession(id: "${eventSessionId}") {
    id
  }
}
`;
  log(`deleted eventSession with Id ${eventSessionId}`);
  await callLocalGraphqlApi(deleteQuery);
};

const updateEventSession = async (sessionId, slots, date, pushManyQuery = '') => {
  const query = `
          mutation{
            updateEventSession(
            id: "${sessionId}",
            input:{
              ${date ? `sessionDate:"${date}",` : ''}
              ${slots || ''}
              ${pushManyQuery || ''}
            }
            ){
              id
            }
          }
          `;
  await callLocalGraphqlApi(query);
  if (pushManyQuery) {
    log(`Event Session ${sessionId} updated for attendance`);
  } else {
    log(`Event Session ${sessionId} updated for date ${date}`);
  }
  return true;
};

const getPossibleSessionCount = (startDateMoment, endDateMoment) => moment.duration(endDateMoment.diff(startDateMoment)).asDays();

const sortEventSessions = (eventSessions) => {
  const today = moment();
  const sessionsStartedOrCompleted = [];
  const sessionsAllotted = [];
  for (const eventSession of eventSessions) {
    const slotsArray = getSelectedSlotsTime(eventSession);
    const sessionDate = new Date(new Date(get(eventSession, 'sessionDate')).setHours(get(slotsArray, '[0]'), 0, 0, 0)).toISOString();
    if (today.diff(sessionDate) > 0) {
      sessionsStartedOrCompleted.push(eventSession);
    } else {
      sessionsAllotted.push(eventSession);
    }
  }
  return {
    sessionsStartedOrCompleted,
    sessionsAllotted,
  };
};

const updateExistingEventSessions = async (sessionsAllotted, possibleDates, filteredSlotsString) => {
  let i = 0;
  /* eslint-disable array-callback-return */
  // eslint-disable-next-line no-restricted-syntax
  for (const session of sessionsAllotted) {
    /* eslint-disable array-callback-return */
    const date = possibleDates[i].toISOString();
    await updateEventSession(session.id, filteredSlotsString, date);
    i += 1;
  }
};

const createEventSessions = async (eventId, possibleDates, filteredSlots, possibleSessionCount) => {
  for (let i = 0; i < possibleSessionCount; i += 1) {
    createEventSession(eventId, possibleDates[possibleDates.length - i - 1].toISOString(), filteredSlots);
  }
  return true;
};

const addUpdateEventSessionsForEvent = async (eventId, timeTableRule, prevTimeTableRule, registeredUsers = [], shouldAddInSession = false) => {
  // start, end dates
  if (timeTableRule) {
    const days = getSelectedDays(timeTableRule);
    const startDate = new Date(timeTableRule.startDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(timeTableRule.endDate);
    endDate.setHours(0, 0, 0, 0);

    // slots passed in input
    const { ...slots } = timeTableRule;
    const { filteredSlotsString } = extractSlotsFromInput(slots);
    const possibleDates = getPossibleDates(startDate, endDate, days);
    if (prevTimeTableRule && timeTableRule) {
      // start, end dates
      const prevDays = getSelectedDays(prevTimeTableRule);
      const prevStartDate = new Date(prevTimeTableRule.startDate);
      prevStartDate.setHours(0, 0, 0, 0);
      const prevEndDate = new Date(prevTimeTableRule.endDate);
      prevEndDate.setHours(0, 0, 0, 0);
      const possiblePrevDates = getPossibleDates(prevStartDate, prevEndDate, prevDays);
      let newDates = [];
      possibleDates.forEach((date) => {
        const notFindDate = possiblePrevDates.find((dateValue) => moment(dateValue).isSame(moment(date)));
        if (!notFindDate) newDates.push(date);
      });
      let sessionDatesFilter = '';
      possiblePrevDates.forEach((date) => {
        const notFindDate = possibleDates.find((dateValue) => moment(dateValue).isSame(moment(date)));
        if (!notFindDate) {
          newDates.push(date);
        }
      });
      newDates = newDates.filter((date) => !(moment().diff(date) > 0));
      newDates.forEach((date) => {
        sessionDatesFilter += ` { sessionDate: "${new Date(date).toDateString()}" }`;
      });
      if (sessionDatesFilter) {
        const eventSessions = await getEventSessions(eventId, sessionDatesFilter);
        if (eventSessions && eventSessions.length > 0) {
          for (const eventSession of eventSessions) {
            if (get(eventSession, 'id')) {
              await deleteEventSession(get(eventSession, 'id'));
            }
          }
        }
      }
    }
    const eventSessions = await getEventSessions(eventId);
    if (eventSessions && eventSessions.length) {
      // sorting the existing event sessions into started/completed and allotted
      // function to sort event sessions
      const {
        sessionsStartedOrCompleted,
        sessionsAllotted,
      } = sortEventSessions(eventSessions);
      // logic for possible session count
      let possibleSessionCount = possibleDates.length;
      if (sessionsStartedOrCompleted.length > 0) {
        // if there exists some started or completed sessions, don't count them, create/update sessions for the remaining
        possibleSessionCount -= sessionsStartedOrCompleted.length;
      }
      // for the sessions which are still in the allotted state, update them
      const allottedSessionsCount = sessionsAllotted.length;
      if (allottedSessionsCount > 0) {
        possibleSessionCount -= allottedSessionsCount;
        updateExistingEventSessions(sessionsAllotted, possibleDates, filteredSlotsString);
      }
      if (possibleSessionCount > 0) {
        // all the remaining sessions have to be created
        createEventSessions(eventId, possibleDates, filteredSlotsString, possibleSessionCount);
      }
    } else {
      // if there are no exisiting eventSessions for the given event id, create all of them
      const possibleSessionCount = possibleDates.length;
      createEventSessions(eventId, possibleDates, filteredSlotsString, possibleSessionCount);
    }
  }
  if (registeredUsers.length > 0 && shouldAddInSession) {
    const eventSessions = await getEventSessionForData(eventId);
    if (eventSessions && eventSessions.length) {
      for (const eventSession of eventSessions) {
        let pushManyQuery = '';
        const alreadyAddedUser = get(eventSession, 'attendance', []).map((attendance) => get(attendance, 'student.id'));
        registeredUsers.forEach((user) => {
          if (!alreadyAddedUser.includes(get(user, 'typeId'))) {
            pushManyQuery += `{studentConnectId: "${get(user, 'typeId')}",},`;
          }
        });
        if (pushManyQuery) pushManyQuery = `attendance:{ pushMany: [${pushManyQuery}] }`;
        if (get(eventSession, 'id') && pushManyQuery) {
          updateEventSession(get(eventSession, 'id'), '', '', pushManyQuery);
        }
      }
    }
  }
};

export {
  getEventSessions,
  getPossibleSessionCount,
  createEventSessions,
  sortEventSessions,
  updateExistingEventSessions,
  addUpdateEventSessionsForEvent,
};

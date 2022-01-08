/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-unused-vars */
import { get } from 'lodash';
import moment from 'moment';
import { log } from '../../../../../utils';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

// query to get eventSessions
const getEventSessions = async (eventId) => {
  const query = `
          {
            eventSessions(filter: {event_some: {id: "${eventId}"}}, orderBy:sessionDate_ASC){
              id
              sessionDate
            }
          }
          `;
  const eventSessions = await callLocalGraphqlApi(query);
  return get(eventSessions, 'data.eventSessions');
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

const updateEventSession = async (sessionId, slots, date) => {
  const query = `
          mutation{
            updateEventSession(
            id: "${sessionId}",
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
  log(`Event Session ${sessionId} updated for date ${date}`);
  return true;
};

const getPossibleSessionCount = (startDateMoment, endDateMoment) => moment.duration(endDateMoment.diff(startDateMoment)).asDays();

const sortEventSessions = (eventSessions) => {
  const today = moment();
  const sessionsStartedOrCompleted = [];
  const sessionsAllotted = [];
  for (const eventSession of eventSessions) {
    const sessionDate = get(eventSession, 'sessionDate');
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

export {
  getEventSessions,
  getPossibleSessionCount,
  createEventSessions,
  sortEventSessions,
  updateExistingEventSessions,
};

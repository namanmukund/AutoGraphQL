/* eslint-disable no-restricted-syntax */
/* eslint-disable no-unused-vars */
import moment from 'moment';

// query to get batch sessions (started, completed)
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
  return true;
};

const getPossibleSessionCount = (startDate, endDate) => moment.duration(endDate.diff(startDate)).asDays();

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
};

export {
  getEventSessions,
  getPossibleSessionCount,
  createEventSession,
  sortEventSessions,
};

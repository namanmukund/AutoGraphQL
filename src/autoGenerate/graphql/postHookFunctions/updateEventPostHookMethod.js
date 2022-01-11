import { get } from 'lodash';
import extractSlotsFromInput from '../../../../utils/extractSlotsFromInput';
import getSelectedDays from './utils/getSelectedDays';
import getPossibleDates from '../../../../utils/getPossibleDates';
import {
  getEventSessions,
  createEventSessions,
  sortEventSessions,
  updateExistingEventSessions,
} from './utils/updateEventPostHookQueries';

/*
  Post hook of update event
*/
/* eslint-disable no-unused-vars */
const updateEventPostHookMethod = async (input, params, mutationName, context) => {
  const { id: eventId } = params;
  const timeTableRule = get(params, 'input.eventTimeTableRule', null);
  const { prevTimeTableRule } = context;
  if (timeTableRule) {
    // event sessions
    const eventSessions = await getEventSessions(eventId);
    // start, end dates
    const days = getSelectedDays(timeTableRule);
    const startDate = new Date(timeTableRule.startDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(timeTableRule.endDate);
    endDate.setHours(0, 0, 0, 0);

    // slots passed in input
    const { ...slots } = timeTableRule;
    const { filteredSlotsString } = extractSlotsFromInput(slots);
    if (eventSessions && eventSessions.length) {
      // sorting the existing event sessions into started/completed and allotted
      // function to sort event sessions
      const {
        sessionsStartedOrCompleted,
        sessionsAllotted,
      } = sortEventSessions(eventSessions);
      // console.log('sessionsAllotted', sessionsAllotted);
      // console.log('sessionsStartedOrCompleted', sessionsStartedOrCompleted);

      // logic for possible session count
      const possibleDates = getPossibleDates(startDate, endDate, days);
      let possibleSessionCount = possibleDates.length;
      // console.log('possibleSessionCount', possibleSessionCount);
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
      if (prevTimeTableRule && timeTableRule) {
      // start, end dates
        const prevDays = getSelectedDays(prevTimeTableRule);
        const prevStartDate = new Date(prevTimeTableRule.startDate);
        prevStartDate.setHours(0, 0, 0, 0);
        const prevEndDate = new Date(prevTimeTableRule.endDate);
        prevEndDate.setHours(0, 0, 0, 0);
        const possiblePrevDates = getPossibleDates(prevStartDate, prevEndDate, prevDays);
        console.log(possibleDates, possiblePrevDates);
      }
    } else {
      // if there are no exisiting eventSessions for the given event id, create all of them
      const possibleDates = getPossibleDates(startDate, endDate, days);
      const possibleSessionCount = possibleDates.length;
      createEventSessions(eventId, possibleDates, filteredSlotsString, possibleSessionCount);
    }
  }
};

export default updateEventPostHookMethod;

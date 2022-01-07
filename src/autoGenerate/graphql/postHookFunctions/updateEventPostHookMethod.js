import { get } from 'lodash';
import extractSlotsFromInput from '../../../../utils/extractSlotsFromInput';
import getSelectedDays from './utils/getSelectedDays';
import getPossibleDates from '../../../../utils/getPossibleDates';
import {
  getEventSessions,
  getPossibleSessionCount,
  createEventSession,
  sortEventSessions,
} from './utils/updateEventPostHookQueries';
// import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
// import getSelectedSlotsTime from '../preHookFunctions/validation/utils/getSelectedSlotsTime';
// import getSlotTimesInString from '../../../../utils/getSlotTimesInString';

/*
  Post hook of update batch
*/
/* eslint-disable no-unused-vars */
const updateEventPostHookMethod = async (input, params, mutationName, context) => {
  const { id: eventId } = params;
  const timeTableRule = get(params, 'input.eventTimeTableRule', null);
  if (timeTableRule) {
    // batch sessions
    const eventSessions = await getEventSessions(eventId);

    // start, end dates
    const days = getSelectedDays(timeTableRule);
    const startDate = new Date(timeTableRule.startDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(timeTableRule.endDate);
    endDate.setHours(0, 0, 0, 0);

    // slots passed in input
    const { ...slots } = timeTableRule;
    const { filteredSlotsString, filteredSlots, filteredSlotsCount } = extractSlotsFromInput(slots);

    if (eventSessions && eventSessions.length) {
      // sorting the existing batch sessions into started/completed and allotted
      // function to sort event sessions
      const {
        sessionsStartedOrCompleted,
        sessionsAllotted,
      } = sortEventSessions(eventSessions);
      // logic for possible sessin count
      let possibleSessionCount = getPossibleSessionCount(startDate, endDate, filteredSlotsCount);
      if (sessionsStartedOrCompleted.length > 0) {
        // if there exists some started or completed sessions, don't count them, create/update sessions for the remaining
        possibleSessionCount -= sessionsStartedOrCompleted.length;
      }

      const possibleDates = getPossibleDates(startDate, endDate, days);
      // for the sessions which are still in the allotted state, update them
      const allottedSessionsCount = sessionsAllotted.length;
      if (allottedSessionsCount > 0) {
        possibleSessionCount -= allottedSessionsCount;
        updateAllottedBatchSessions(sessionsAllotted, possibleDates, filteredSlotsString, slots, mentorUserId, courseId, batchType);
      }
      if (possibleSessionCount > 0) {
        // all the remaining sessions have to be created
        createEventSession(eventId, possibleDates, filteredSlotsString, slots, possibleSessionCount);
      }
    } else {
      // if there are no exisiting batchSessions for the given batch id, create all of them
      const possibleSessionCount = topicCount;
      const possibleDates = getPossibleDates(startDate, endDate, days);
      createEventSession(eventId, possibleDates, filteredSlotsString, slots, possibleSessionCount);
    }
  }
};

export default updateEventPostHookMethod;

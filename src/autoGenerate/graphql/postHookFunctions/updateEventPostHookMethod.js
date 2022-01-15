import { get } from 'lodash';
import {
  addUpdateEventSessionsForEvent,
} from './utils/updateEventPostHookQueries';
import sendCommsForUpdatedEvents from './utils/sendCommsForUpdatedEvents';
/*
  Post hook of update event
*/
/* eslint-disable no-unused-vars */
const updateEventPostHookMethod = async (input, params, mutationName, context) => {
  const { id: eventId } = params;
  const registeredUsers = get(input, 'registeredUsers', []);
  const timeTableRule = get(params, 'input.eventTimeTableRule', null);
  const shouldSendRescheduledComms = get(params, 'input.shouldSendRescheduledComms', false);
  const shouldSendCanceledComms = get(params, 'input.shouldSendCanceledComms', false);
  const eventRescheduledReason = get(params, 'input.rescheduledReason', null);
  const eventCancellationReason = get(params, 'input.cancellationReason', null);
  const {
    prevTimeTableRule,
    previousEventStatus,
  } = context;
  addUpdateEventSessionsForEvent(eventId, timeTableRule, prevTimeTableRule, registeredUsers);
  if ((get(timeTableRule, 'startDate') !== get(prevTimeTableRule, 'startDate')
  || get(timeTableRule, 'endDate') !== get(prevTimeTableRule, 'endDate'))) {
    if (shouldSendRescheduledComms) {
      sendCommsForUpdatedEvents(eventId, eventRescheduledReason, 'rescheduled');
    }
  }
  if (previousEventStatus === 'cancelled' && shouldSendCanceledComms) {
    sendCommsForUpdatedEvents(eventId, eventCancellationReason, 'canceled');
  }
};

export default updateEventPostHookMethod;

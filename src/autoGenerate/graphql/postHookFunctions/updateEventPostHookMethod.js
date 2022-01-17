/* eslint-disable no-restricted-syntax */
import { get } from 'lodash';
import moment from 'moment';
import {
  addUpdateEventSessionsForEvent,
} from './utils/updateEventPostHookQueries';
import sendCommsForUpdatedEvents from './utils/sendCommsForUpdatedEvents';
import addToSchedule from '../../../../utils/scheduleJobs/addToSchedule';
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
  const eventCommsRules = get(params, 'input.eventCommsRule', null);
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
  if (previousEventStatus === 'published') {
    for (const eventCommsRule of eventCommsRules) {
      const dateCondition = get(eventCommsRule, 'condition', null);
      switch (dateCondition) {
        case 'before': {
          const startDate = get(timeTableRule, 'startDate', null);
          const scheduledTime = moment(startDate).subtract(get(eventCommsRule, 'value', 0), get(eventCommsRule, 'unit', 'days'));
          addToSchedule('eventCommsJob', scheduledTime, {
            eventId,
            eventCommsRule,
          });
          break;
        }
        case 'after': {
          const endDate = get(timeTableRule, 'endDate', null);
          const scheduledTime1 = moment(endDate).add(get(eventCommsRule, 'value', 0), get(eventCommsRule, 'unit', 'days'));
          addToSchedule('eventCommsJob', scheduledTime1, {
            eventId,
            eventCommsRule,
          });
          break;
        }
        default:
          break;
      }
    }
  }
};

export default updateEventPostHookMethod;

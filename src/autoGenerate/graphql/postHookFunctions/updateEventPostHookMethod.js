/* eslint-disable no-restricted-syntax */
import { get } from 'lodash';
import moment from 'moment';
import {
  addUpdateEventSessionsForEvent,
} from './utils/updateEventPostHookQueries';
import sendCommsForUpdatedEvents from './utils/sendCommsForUpdatedEvents';
import addToSchedule from '../../../../utils/scheduleJobs/addToSchedule';
import getSelectedSlotsTime from '../preHookFunctions/validation/utils/getSelectedSlotsTime';
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
  const eventCommsRules = get(input, 'eventCommsRule', null);
  const eventStatus = get(input, 'status', null);
  const {
    prevTimeTableRule,
    previousEventStatus,
  } = context;
  const { ...slots } = timeTableRule;
  const slotsTime = getSelectedSlotsTime(slots);
  const isEventRescheduled = (get(prevTimeTableRule, 'startDate') && get(timeTableRule, 'startDate') !== get(prevTimeTableRule, 'startDate'))
    || (slotsTime.length && get(context, 'prevSlotTimes').length && slotsTime[0] !== get(context, 'prevSlotTimes')[0]);
  if (isEventRescheduled) {
    addUpdateEventSessionsForEvent(eventId, timeTableRule, prevTimeTableRule, registeredUsers);
    if (shouldSendRescheduledComms) {
      sendCommsForUpdatedEvents(eventId, eventRescheduledReason, 'rescheduled');
    }
  }
  if ((previousEventStatus !== 'cancelled' && eventStatus === 'cancelled') && shouldSendCanceledComms) {
    sendCommsForUpdatedEvents(eventId, eventCancellationReason, 'canceled');
  }
  if ((previousEventStatus !== 'published' && eventStatus === 'published') || isEventRescheduled) {
    for (const eventCommsRule of eventCommsRules) {
      if (!get(eventCommsRule, 'isSend') && get(eventCommsRule, 'condition') !== 'afterRegistration') {
        const dateCondition = get(eventCommsRule, 'condition', null);
        switch (dateCondition) {
          case 'before': {
            const startDate = get(timeTableRule, 'startDate', null);
            const scheduledDate = moment(startDate).subtract(get(eventCommsRule, 'value', 0), get(eventCommsRule, 'unit', 'days'));
            addToSchedule('eventCommsJob', scheduledDate, {
              eventId,
              eventCommsRule,
            });
            break;
          }
          case 'after': {
            const endDate = get(timeTableRule, 'endDate', null);
            const scheduledDate = moment(endDate).add(get(eventCommsRule, 'value', 0), get(eventCommsRule, 'unit', 'days'));
            addToSchedule('eventCommsJob', scheduledDate, {
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
  }
};

export default updateEventPostHookMethod;

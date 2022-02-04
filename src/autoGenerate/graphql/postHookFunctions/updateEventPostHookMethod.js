/* eslint-disable no-restricted-syntax */
import { get } from 'lodash';
import moment from 'moment';
import {
  addUpdateEventSessionsForEvent,
} from './utils/updateEventPostHookQueries';
import sendCommsForUpdatedEvents from './utils/sendCommsForUpdatedEvents';
import addToSchedule from '../../../../utils/scheduleJobs/addToSchedule';
import getSelectedSlotsTime from '../preHookFunctions/validation/utils/getSelectedSlotsTime';
import eventsLSQActions from './utils/eventsLSQActions';
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
  const eventTimeTableRuleFromDb = get(input, 'eventTimeTableRule');
  const {
    prevTimeTableRule,
    previousEventStatus,
    shouldAddInSession = false,
  } = context;
  const { ...slots } = timeTableRule;
  const slotsTime = getSelectedSlotsTime(slots);
  const isEventRescheduled = (get(prevTimeTableRule, 'startDate') && !moment(get(timeTableRule, 'startDate')).isSame(moment(get(prevTimeTableRule, 'startDate'))))
    || (get(prevTimeTableRule, 'endDate') && !moment(get(timeTableRule, 'endDate')).isSame(moment(get(prevTimeTableRule, 'endDate'))))
    || (slotsTime.length && get(context, 'prevSlotTimes').length && slotsTime[0] !== get(context, 'prevSlotTimes')[0]);
  addUpdateEventSessionsForEvent(eventId, timeTableRule, prevTimeTableRule, registeredUsers, shouldAddInSession);
  if (isEventRescheduled) {
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
        const slotsFromDb = getSelectedSlotsTime(eventTimeTableRuleFromDb);
        switch (dateCondition) {
          case 'before': {
            const startDate = get(eventTimeTableRuleFromDb, 'startDate', null);
            const scheduledDate = moment(moment(startDate).set('hours', get(slotsFromDb, '[0]'))).subtract(get(eventCommsRule, 'value', 0), get(eventCommsRule, 'unit', 'days'));
            addToSchedule('eventCommsJob', scheduledDate, {
              eventId,
              eventCommsRule,
            });
            break;
          }
          case 'after': {
            const endDate = get(eventTimeTableRuleFromDb, 'endDate', null);
            const scheduledDate = moment(moment(endDate).set('hours', get(slotsFromDb, '[0]') + 1)).add(get(eventCommsRule, 'value', 0), get(eventCommsRule, 'unit', 'days'));
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
  if (get(context, 'newRegisteredUserId') && eventStatus === 'published') {
    eventsLSQActions(eventId, get(context, 'newRegisteredUserId'), 'eventRegistration');
    for (const eventCommsRule of eventCommsRules) {
      if (get(eventCommsRule, 'condition') === 'afterRegistration') {
        const scheduledDate = moment().add(get(eventCommsRule, 'value', 0), get(eventCommsRule, 'unit', 'days'));
        addToSchedule('eventNewRegistrationReminder', scheduledDate, {
          eventId,
          eventCommsRule,
          studentProfileId: get(context, 'newRegisteredUserId'),
        });
      }
    }
  }
};

export default updateEventPostHookMethod;

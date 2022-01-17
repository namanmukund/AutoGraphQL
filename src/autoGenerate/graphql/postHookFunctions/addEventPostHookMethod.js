/* eslint-disable no-case-declarations */
/* eslint-disable no-restricted-syntax */
import { get } from 'lodash';
import moment from 'moment';
import {
  addUpdateEventSessionsForEvent,
} from './utils/updateEventPostHookQueries';
import addToSchedule from '../../../../utils/scheduleJobs/addToSchedule';

/*
  Post hook of update event
*/
/* eslint-disable no-unused-vars */
const addEventPostHookMethod = async (input, params, mutationName, context) => {
  const { id: eventId } = input;
  const timeTableRule = get(params, 'input.eventTimeTableRule', null);
  const eventCommsRules = get(params, 'input.eventCommsRule', null);
  if (timeTableRule) {
    addUpdateEventSessionsForEvent(eventId, timeTableRule);
  }
  for (const eventCommsRule of eventCommsRules) {
    const dateCondition = get(eventCommsRule, 'condition', null);
    switch (dateCondition) {
      case 'before':
        const startDate = get(timeTableRule, 'startDate', null);
        const scheduledTime = moment(startDate).subtract(get(eventCommsRule, 'value', 0), get(eventCommsRule, 'unit', 'days'));
        addToSchedule('eventCommsJob', scheduledTime, {
          eventId,
          eventCommsRule,
        });
        break;
      case 'after':
        const endDate = get(timeTableRule, 'endDate', null);
        const scheduledTime1 = moment(endDate).add(get(eventCommsRule, 'value', 0), get(eventCommsRule, 'unit', 'days'));
        addToSchedule('eventCommsJob', scheduledTime1, {
          eventId,
          eventCommsRule,
        });
        break;
      default:
        break;
    }
  }
};

export default addEventPostHookMethod;

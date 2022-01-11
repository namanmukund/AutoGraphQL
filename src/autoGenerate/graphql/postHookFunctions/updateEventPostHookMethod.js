import { get } from 'lodash';
import {
  addUpdateEventSessionsForEvent,
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
    addUpdateEventSessionsForEvent(eventId, timeTableRule, prevTimeTableRule);
  }
};

export default updateEventPostHookMethod;

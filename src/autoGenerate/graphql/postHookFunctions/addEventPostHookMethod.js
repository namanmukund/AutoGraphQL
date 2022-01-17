/* eslint-disable no-restricted-syntax */
import { get } from 'lodash';
import {
  addUpdateEventSessionsForEvent,
} from './utils/updateEventPostHookQueries';

/*
  Post hook of update event
*/
/* eslint-disable no-unused-vars */
const addEventPostHookMethod = async (input, params, mutationName, context) => {
  const { id: eventId } = input;
  const timeTableRule = get(params, 'input.eventTimeTableRule', null);
  if (timeTableRule) {
    addUpdateEventSessionsForEvent(eventId, timeTableRule);
  }
};

export default addEventPostHookMethod;

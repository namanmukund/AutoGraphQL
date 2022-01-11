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
  const registeredUsers = get(input, 'registeredUsers', []);
  const timeTableRule = get(params, 'input.eventTimeTableRule', null);
  const { prevTimeTableRule } = context;
  addUpdateEventSessionsForEvent(eventId, timeTableRule, prevTimeTableRule, registeredUsers);
};

export default updateEventPostHookMethod;

import { get } from 'lodash';
import { MultipleRegistrationError, AlreadyRegisteredForEvent } from '../../../../../constants/errors';
import getSlotTimesInString from '../../../../../utils/getSlotTimesInString';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import getSelectedSlotsTime from './utils/getSelectedSlotsTime';
import validateBookingDate from './utils/validateBookingDate';

const getEventDetails = async (eventId, registeredUserId) => {
  const query = `{
  event(id:"${eventId}") {
    id
    status
    ${registeredUserId ? `registeredUsers(filter: { id: "${registeredUserId}" }) {
      id
    }` : ''}
    ${!registeredUserId ? `eventTimeTableRule {
      monday
      tuesday
      wednesday
      thursday
      friday
      saturday
      sunday
      ${getSlotTimesInString()}
      startDate
      endDate
    }` : ''}
  }
}
`;
  const result = await callLocalGraphqlApi(query);
  return get(result, 'data.event');
};

const updateEventValidation = async (params, input, mutationName, context) => {
  const { id: eventId, registeredUsersConnectIds = [] } = params;
  const eventTimeTableRule = get(params, 'input.eventTimeTableRule');
  const eventData = await getEventDetails(eventId);
  if (get(eventTimeTableRule, 'startDate') && get(eventTimeTableRule, 'endDate')) {
    const { startDate, endDate, ...slots } = eventTimeTableRule;
    const slotsTime = getSelectedSlotsTime(slots);
    validateBookingDate(startDate, slotsTime, 0);
    context.prevSlotTimes = slotsTime;
    context.prevTimeTableRule = get(eventData, 'eventTimeTableRule');
  }
  context.previousEventStatus = get(eventData, 'status');
  const { startDate, endDate, ...slots } = get(eventData, 'eventTimeTableRule');
  const slotsTime = getSelectedSlotsTime(slots);
  console.log(JSON.stringify(eventData), endDate, slotsTime);
  if (registeredUsersConnectIds.length) {
    if (registeredUsersConnectIds.length > 1) {
      throw new MultipleRegistrationError();
    }
    const currentEvent = await getEventDetails(eventId, get(registeredUsersConnectIds, '[0]'));
    if (get(currentEvent, 'registeredUsers', []).length) {
      throw new AlreadyRegisteredForEvent();
    }
    context.newRegisteredUserId = get(registeredUsersConnectIds, '[0]');
  }
  return true;
};

export default updateEventValidation;

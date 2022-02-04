import { get } from 'lodash';
import moment from 'moment';
import { MultipleRegistrationError, AlreadyRegisteredForEvent, RegistrationClosedForEvent } from '../../../../../constants/errors';
import getSlotTimesInString from '../../../../../utils/getSlotTimesInString';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import getSelectedSlotsTime from './utils/getSelectedSlotsTime';

const getEventDetails = async (eventId, registeredUserId) => {
  const query = `{
  event(id:"${eventId}") {
    id
    status
    ${registeredUserId ? `registeredUsers(filter: { id: "${registeredUserId}" }) {
      id
    }` : ''}
    eventStartTime
    eventEndTime
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
  const eventData = await getEventDetails(eventId, get(registeredUsersConnectIds, '[0]'));
  if (get(eventTimeTableRule, 'startDate') && get(eventTimeTableRule, 'endDate')) {
    const { startDate, endDate, ...slots } = eventTimeTableRule;
    const slotsTime = getSelectedSlotsTime(slots);
    context.prevSlotTimes = slotsTime;
    context.prevTimeTableRule = get(eventData, 'eventTimeTableRule');
  }
  context.previousEventStatus = get(eventData, 'status');
  if (registeredUsersConnectIds.length) {
    if (registeredUsersConnectIds.length > 1) {
      throw new MultipleRegistrationError();
    }
    if (get(eventData, 'registeredUsers', []).length) {
      throw new AlreadyRegisteredForEvent();
    }
    const { eventStartTime } = eventData;
    const registrationEndTime = moment(eventStartTime).subtract(30, 'minutes');
    const shouldAddInSession = moment().isBetween(moment(eventStartTime).subtract(1, 'hour'), moment(eventStartTime));
    context.shouldAddInSession = shouldAddInSession;
    if (moment().isAfter(registrationEndTime) || get(eventData, 'status') !== 'published') {
      throw new RegistrationClosedForEvent();
    }
    context.newRegisteredUserId = get(registeredUsersConnectIds, '[0]');
  }
  return true;
};

export default updateEventValidation;

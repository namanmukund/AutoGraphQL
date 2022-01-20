import { get } from 'lodash';
import getSlotTimesInString from '../../../../../utils/getSlotTimesInString';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import getSelectedSlotsTime from './utils/getSelectedSlotsTime';
import validateBookingDate from './utils/validateBookingDate';

const getEventTimeTableRule = async (eventId) => {
  const query = `{
  event(id:"${eventId}") {
    id
    status
    eventTimeTableRule {
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
    }
  }
}
`;
  const result = await callLocalGraphqlApi(query);
  return get(result, 'data.event');
};

const updateEventValidation = async (params, input, mutationName, context) => {
  const { id: eventId } = params;
  const eventTimeTableRule = get(params, 'input.eventTimeTableRule');
  if (get(eventTimeTableRule, 'startDate')) {
    const { startDate, ...slots } = eventTimeTableRule;
    const slotsTime = getSelectedSlotsTime(slots);
    validateBookingDate(startDate, slotsTime, 0);
    context.prevSlotTimes = slotsTime;
  }
  const eventData = await getEventTimeTableRule(eventId);
  context.prevTimeTableRule = get(eventData, 'eventTimeTableRule');
  context.previousEventStatus = get(eventData, 'status');
};

export default updateEventValidation;

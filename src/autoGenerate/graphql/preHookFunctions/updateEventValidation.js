import { get } from 'lodash';
import getSlotTimesInString from '../../../../utils/getSlotTimesInString';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';

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
  const prevTimeTableRule = await getEventTimeTableRule(eventId);
  context.prevTimeTableRule = get(prevTimeTableRule, 'eventTimeTableRule');
  context.previousEventStatus = get(prevTimeTableRule, 'status');
};

export default updateEventValidation;

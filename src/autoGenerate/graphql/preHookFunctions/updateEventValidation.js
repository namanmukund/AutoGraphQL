import { get } from 'lodash';
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
      slot0
      slot1
      slot2
      slot3
      slot4
      slot5
      slot6
      slot7
      slot8
      slot9
      slot10
      slot11
      slot12
      slot13
      slot14
      slot15
      slot16
      slot17
      slot18
      slot19
      slot20
      slot21
      slot22
      slot23
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

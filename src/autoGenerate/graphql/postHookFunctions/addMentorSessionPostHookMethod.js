import { get } from 'lodash';
import getSlotTimesInString from '../../../../utils/getSlotTimesInString';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import getSelectedSlotsStringArray from './utils/getSelectedSlotsStringArray';

const availableSlotsQuery = (date) => `
query{
  availableSlots(filter:{
    date:"${date}"
  }){
    id
    date
    ${getSlotTimesInString()}
  }
}
`;
const addAvailableSlotQuery = () => `
mutation($input:AvailableSlotInput!){
  addAvailableSlot(input:$input){
    id
    date
  }
}`;

const updateAvailableSlotQuery = (availableSlotId) => `
mutation($input:AvailableSlotUpdate!){
  updateAvailableSlot(id:"${availableSlotId}", input: $input){
    id
  }
}
`;

const addMentorSessionPostHookMethod = async (input, mutationName, context) => {
  const { availabilityDate, ...slots } = input;
  const availableSlotsRes = await callLocalGraphqlApi(availableSlotsQuery(availabilityDate));
  const availableSlots = get(availableSlotsRes, 'data.availableSlots');

  // update if available slots for a particular date exist from before
  const docToBeUpdated = {};
  const slotTimeStringArray = getSelectedSlotsStringArray(slots);

  if (availableSlots && availableSlots.length) {
    slotTimeStringArray.forEach((slot) => {
      console.log(333333, slot);
      docToBeUpdated[slot] = availableSlots[0][slot] + 1;
    });
    const { id: availableSlotId } = availableSlots[0];
    console.log(33333, docToBeUpdated);
    const variables = {
      input: docToBeUpdated,
    };
    await callLocalGraphqlApi(updateAvailableSlotQuery(availableSlotId), context, variables);
    // update
  } else {
    slotTimeStringArray.forEach((slot) => {
      docToBeUpdated[slot] = 1;
      docToBeUpdated.date = availabilityDate.toISOString();
    });
    // add
    const variables = {
      input: docToBeUpdated,
    };
    await callLocalGraphqlApi(addAvailableSlotQuery(docToBeUpdated), context, variables);
  }
};

export default addMentorSessionPostHookMethod;

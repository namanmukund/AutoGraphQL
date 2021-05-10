import { slotTimes } from '../../../constants';

const getSlotTimeFields = (
  fieldType,
) => {
  let slotTimeFields = '';
  slotTimes.forEach((slotTime) => {
    slotTimeFields += `${slotTime}: ${fieldType} `;
  });
  return slotTimeFields;
};

export default getSlotTimeFields;

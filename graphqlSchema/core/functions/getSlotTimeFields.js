import { slotTimes } from '../../../constants';

const getSlotTimeFields = (
  fieldType,
  excludeType,
) => {
  let slotTimeFields = '';
  slotTimes.forEach((slotTime) => {
    slotTimeFields += excludeType ? `${slotTime}` : `${slotTime}: ${fieldType} `;
  });
  return slotTimeFields;
};

export default getSlotTimeFields;

import { slotTimes } from '../../../constants';

const getSlotTimeFields = (
  fieldType,
  excludeType,
) => {
  let slotTimeFields = '';
  slotTimes.forEach((slotTime) => {
    slotTimeFields += excludeType ? `${slotTime}\n` : `${slotTime}: ${fieldType} `;
  });
  return slotTimeFields;
};

export default getSlotTimeFields;

import { slotTimes } from '../../../../constants';

const getSlotTimeFields = (
  fieldType,
  defaultValue,
) => {
  let slotTimeFields = '';
  slotTimes.forEach((slotTime) => {
    slotTimeFields += `${slotTime}: ${fieldType} @defaultValue(value: ${defaultValue}) `;
  });
  return slotTimeFields;
};

export default getSlotTimeFields;

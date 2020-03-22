import { slotTimes } from '../../../../../constants';

let slotTimeFields = '';
slotTimes.forEach((slotTime) => {
  slotTimeFields += `${slotTime}: Int @defaultValue(value: 0) `;
});

const SlotSession = `
  type SlotSession @model {
    date: Date
    ${slotTimeFields}
}`;

export default [SlotSession];

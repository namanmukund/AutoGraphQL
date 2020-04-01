import getSlotTimeFields from '../../functions/getSlotTimeFields';

const slotTimeFields = getSlotTimeFields('Int', 0);

const AvailableSlot = `
  type AvailableSlot @model {
    date: Date
    ${slotTimeFields}
}`;

export default [AvailableSlot];

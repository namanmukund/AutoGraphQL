import getSlotTimeFields from '../../functions/getSlotTimeFields';

const slotTimeFields = getSlotTimeFields('Boolean', false);

const ShiftBatchSessionsInput = `
  input ShiftBatchSessionsInput {
    date: Date
    batchId: String!
    ${slotTimeFields}
  }
`;

export default ShiftBatchSessionsInput;

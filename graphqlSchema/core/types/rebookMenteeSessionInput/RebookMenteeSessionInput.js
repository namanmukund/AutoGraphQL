import getSlotTimeFields from '../../functions/getSlotTimeFields';

const slotTimeFields = getSlotTimeFields('Boolean', false);

const RebookMenteeSessionInput = `
  input RebookMenteeSessionInput {
    ${slotTimeFields}
    bookingDate: Date!
  }
`;

export default RebookMenteeSessionInput;

import getSlotTimeFields from '../../functions/getSlotTimeFields';

const slotTimeFields = getSlotTimeFields('Boolean', false);

const RebookMenteeSessionInput = `
  input RebookMenteeSessionInput {
    menteeSessionId: String!
    ${slotTimeFields}
    bookingDate: Date!
  }
`;

export default RebookMenteeSessionInput;

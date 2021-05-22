import getSlotTimeFields from '../../functions/getSlotTimeFields';

const slotTimeFields = getSlotTimeFields('Boolean', false);

const BookB2B2CSlotsInput = `
  input BookB2B2CSlotsInput {
    campaignId: ID!
    userId: ID!
    ${slotTimeFields}
    bookingDate: Date!
    mentorSessionId: ID
  }`;

export default [
  BookB2B2CSlotsInput,
];

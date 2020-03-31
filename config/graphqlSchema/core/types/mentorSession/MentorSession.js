import getSlotTimeFields from '../../functions/getSlotTimeFields';

const slotTimeFields = getSlotTimeFields('Boolean', false);

const MentorSession = `
  type MentorSession @model {
    user: User! @relation(name: "MentorSessionUser", direction: "OneWay")
    availabilityDate: Date
    ${slotTimeFields}
}`;

export default [MentorSession];

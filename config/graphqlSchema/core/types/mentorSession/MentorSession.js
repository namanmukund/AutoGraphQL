import { slotTimes } from '../../../../../constants';

let slotTimeFields = '';
slotTimes.forEach((slotTime) => {
  slotTimeFields += `${slotTime}: Boolean @defaultValue(value: false) `;
});

const MentorSession = `
  type MentorSession @model {
    user: User! @relation(name: "MentorSessionUser")
    date: Date
    ${slotTimeFields}
}`;

export default [MentorSession];

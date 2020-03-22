import { slotTimes } from '../../../../../constants';

let slotTimeFields = '';
slotTimes.forEach((slotTime) => {
  slotTimeFields += `${slotTime}: Boolean @defaultValue(value: false) `;
});

const MenteeSession = `
  type MenteeSession @model {
    user: User! @relation(name: "MenteeSessionUser", direction: "OneWay")
    topic: Topic! @relation(name: "MenteeSessionTopic", direction: "OneWay")
    mentor: User @relation(name: "MenteeSessionMentor", direction: "OneWay")
    date: Date
    ${slotTimeFields}
}`;

export default [MenteeSession];

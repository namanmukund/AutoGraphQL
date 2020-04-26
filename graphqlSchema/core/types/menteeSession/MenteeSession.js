import getSlotTimeFields from '../../functions/getSlotTimeFields';

const slotTimeFields = getSlotTimeFields('Boolean', false);

const MenteeSession = `
  type MenteeSession @model {
    user: User! @relation(name: "MenteeSessionUser", direction: "OneWay")
    course: Course! @relation(name: "MenteeSessionCourse", direction: "OneWay")
    topic: Topic! @relation(name: "MenteeSessionTopic", direction: "OneWay")
    mentor: User @relation(name: "MenteeSessionMentor", direction: "OneWay")
    bookingDate: Date!
    ${slotTimeFields}
}`;

export default [MenteeSession];

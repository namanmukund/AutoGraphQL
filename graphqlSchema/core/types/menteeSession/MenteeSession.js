import getSlotTimeFields from '../../functions/getSlotTimeFields';

const slotTimeFields = getSlotTimeFields('Boolean', false);

const MenteeSession = `
  type MenteeSession @model {
    user: User! @relation(name: "MenteeSessionUser", direction: "OneWay")
    topic: Topic! @relation(name: "MenteeSessionTopic", direction: "OneWay")
    bookingDate: Date!
    scheduleRunStatus: ScheduleRunStatus
    ${slotTimeFields}
}`;

export default [MenteeSession];

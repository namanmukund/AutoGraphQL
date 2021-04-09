import getSlotTimeFields from '../../functions/getSlotTimeFields';

const slotTimeFields = getSlotTimeFields('Boolean', false);

const MenteeSession = `
  type MenteeSession @model {
    user: User! @relation(name: "MenteeSessionUser", direction: "OneWay")
    topic: Topic! @relation(name: "MenteeSessionTopic", direction: "OneWay")
    bookingDate: Date!
    scheduleRunStatus: ScheduleRunStatus
    ${slotTimeFields}
    source: UserOriginSource @defaultValue(value: "website")
    country: Country @defaultValue(value: "india")
    bookedBy: BookedBy @defaultValue(value: "customer")
}`;

export default [MenteeSession];

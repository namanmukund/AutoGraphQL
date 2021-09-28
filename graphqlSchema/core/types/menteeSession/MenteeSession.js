import getSlotTimeFields from '../../functions/getSlotTimeFields';

const slotTimeFields = getSlotTimeFields('Boolean', false);

const MenteeSession = `
  type MenteeSession @model {
    course: Course @relation(name: "MenteeSessionCourse", direction: "OneWay")
    user: User! @relation(name: "MenteeSessionUser", direction: "OneWay")
    topic: Topic! @relation(name: "MenteeSessionTopic", direction: "OneWay")
    bookingDate: Date!
    scheduleRunStatus: ScheduleRunStatus
    ${slotTimeFields}
    source: UserOriginSource @defaultValue(value: "website")
    country: Country @defaultValue(value: "india")
    bookedBy: BookedBy @defaultValue(value: "customer")
    bookingAgent: User @relation(name: "BookingAgent", direction: "OneWay")
    mentorDemandSlot: MentorDemandSingleSlot @relation(name:"MentorDemandSingleSlotMenteeSession")
    broadCastedMentors: [MentorProfile] @relation(name:"MenteeSessionBroadcastedMentors", direction: "OneWay")
}`;

export default [MenteeSession];

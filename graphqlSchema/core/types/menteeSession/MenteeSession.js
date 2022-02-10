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
    startMinutes: Int @defaultValue(value: "0")
    endMinutes: Int @defaultValue(value: "0")
    source: UserOriginSource @defaultValue(value: "website")
    country: Country @defaultValue(value: "india")
    bookedBy: BookedBy @defaultValue(value: "customer")
    bookingAgent: User @relation(name: "BookingAgent", direction: "OneWay")
    mentorAvailabilitySlot: MentorAvailabilitySlot @relation(name:"MentorAvailabilitySlotMenteeSession")
    broadCastedMentors: [MentorProfile] @relation(name:"MenteeSessionBroadcastedMentors", direction: "OneWay")
    studentProfile: StudentProfile @relation(name:"MenteeSessionStudentProfile", direction: "OneWay")
    bookingAgent: User @relation(name: "MenteeSessionBookingAgent", direction: "OneWay")
    bookedAt: Date
}`;

export default [MenteeSession];

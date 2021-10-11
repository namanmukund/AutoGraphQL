import getSlotTimeFields from '../../functions/getSlotTimeFields';

const slotTimeFields = getSlotTimeFields('Boolean', false);

const AdhocSession = `
  type AdhocSession @model {
    course: Course @relation(name: "BatchSessionCourse", direction: "OneWay")
    batch: Batch! @relation(name: "BatchSessionBatch", direction: "OneWay")
    previousTopic: Topic @relation(name: "BatchSessionTopic", direction: "OneWay")
    title: String! @trim
    order: Int!
    mentorSession: MentorSession @relation(name: "BatchSessionMentorSession")
    bookingDate: Date!
    scheduleRunStatus: ScheduleRunStatus
    ${slotTimeFields}
    sessionAllotmentDate: Date
    sessionStartDate: Date
    sessionEndDate: Date
    sessionStatus: SessionStatus! @defaultValue(value: "allotted")
    sessionRecordingLink: String
    sessionCommentByMentor: String
    attendance: [BatchAttendanceType]
    mentorPaymentStatus: MentorPaymentStatus @defaultValue(value: "declined")
    mentorPaymentJustification: String
    paymentApprovedBy: User @relation(name: "MentorMenteeSessionPaymentApprovedUser", direction: "OneWay")
    isAudit: Boolean @defaultValue(value: "false")
    mentorDemandSlot: MentorDemandSingleSlot @relation(name:"MentorDemandSingleSlotBatchSession")
    broadCastedMentors: [MentorProfile] @relation(name:"MentorDemandSingleSlotMentor", direction: "OneWay")
}`;

export default [AdhocSession];

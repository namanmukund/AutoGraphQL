import getSlotTimeFields from '../../functions/getSlotTimeFields';

const slotTimeFields = getSlotTimeFields('Boolean', false);

const batchAttendanceType = `
  type BatchAttendanceType {
   student: StudentProfile! @relation(name:"BatchSessionStudentProfile", direction: "OneWay")
   isPresent: Boolean
   status: AttendanceStatus @defaultValue(value: "notAssigned")
   absentReason: String
 }`;

const BatchSession = `
  type BatchSession @model {
    course: Course @relation(name: "BatchSessionCourse", direction: "OneWay")
    batch: Batch! @relation(name: "BatchSessionBatch", direction: "OneWay")
    topic: Topic @relation(name: "BatchSessionTopic", direction: "OneWay")
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
    isFeedbackSubmitted: Boolean @defauly(value: "false")
    mentorPaymentStatus: MentorPaymentStatus @defaultValue(value: "declined")
    mentorPaymentJustification: String
    paymentApprovedBy: User @relation(name: "MentorMenteeSessionPaymentApprovedUser", direction: "OneWay")
    isAudit: Boolean @defaultValue(value: "false")
    mentorAvailabilitySlot: MentorAvailabilitySlot @relation(name:"MentorAvailabilitySlotBatchSession")
    broadCastedMentors: [MentorProfile] @relation(name:"BatchSessionBroadcastedMentors", direction: "OneWay")
    isBroadCastedSession: Boolean @defaultValue(value: "false")
}`;

export default [BatchSession, batchAttendanceType];

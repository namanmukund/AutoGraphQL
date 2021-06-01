import getSlotTimeFields from '../../functions/getSlotTimeFields';

const slotTimeFields = getSlotTimeFields('Boolean', false);

const batchAttendanceType = `
  type BatchAttendanceType {
   student: StudentProfile! @relation(name:"BatchSessionStudentProfile", direction: "OneWay")
   isPresent: Boolean
   absentReason: String
 }`;

const BatchSession = `
  type BatchSession @model {
    batch: Batch! @relation(name: "BatchSessionBatch", direction: "OneWay")
    topic: Topic! @relation(name: "BatchSessionTopic", direction: "OneWay")
    mentorSession: MentorSession! @relation(name: "SessionDataMentorSession", direction: "OneWay")
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
}`;

export default [BatchSession, batchAttendanceType];

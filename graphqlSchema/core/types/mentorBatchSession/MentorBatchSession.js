const MentorBatchSession = `
  type MentorBatchSession @model {
    topic: Topic! @relation(name: "MentorMenteeSessionTopic", direction: "OneWay")
    batchSession: BatchSession! @relation(name: "SessionDataMenteeSession", direction: "OneWay")
    mentorSession: MentorSession! @relation(name: "SessionDataMentorSession", direction: "OneWay")
    sessionAllotmentDate: Date
    sessionStartDate: Date
    sessionEndDate: Date
    sessionStatus: SessionStatus! @defaultValue(value: "allotted")
    sessionRecordingLink: String
    sessionCommentByMentor: String
    mentorPaymentStatus: MentorPaymentStatus @defaultValue(value: "declined")
    mentorPaymentJustification: String
    paymentApprovedBy: User @relation(name: "MentorMenteeSessionPaymentApprovedUser", direction: "OneWay")
}`;

export default [MentorBatchSession];

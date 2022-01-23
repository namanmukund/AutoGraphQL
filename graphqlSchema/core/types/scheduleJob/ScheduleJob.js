const ScheduleJob = `
  type ScheduleJob @model {
    menteeSession: MenteeSession @relation(name: "ScheduleJobMenteeSession", direction: "OneWay")
    menteeSessionId: String
    mentorMenteeSessionId: String
    menteeId: String
    menteeSessionUpdatedAt: Date
    parent: User @relation(name: "ScheduleJobParent", direction: "OneWay")
    scheduledDate: Date
    jobType: String
    batchSessionId: String
    code: String
    batchSessionId: String
    courseName: String
    batchCode: String
    schoolName: String
    sessionDate: String
    sessionTime: String
    sessionLink: String
    mentorUserId: String
    mentorPhoneNumber: String
    eventId: String
    eventSessionId: String
    commsVariables: [CommsVariableType]
    studentProfileId: String
    templateName: String
    isEmailRule: Boolean
}`;

export default [ScheduleJob];

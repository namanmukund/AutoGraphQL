const ScheduleJob = `
  type ScheduleJob @model {
    menteeSession: MenteeSession @relation(name: "ScheduleJobMenteeSession", direction: "OneWay")
    menteeSessionId: String
    menteeId: String
    menteeSessionUpdatedAt: Date
    parent: User @relation(name: "ScheduleJobParent", direction: "OneWay")
    scheduledDate: Date
    jobType: String
    batchSessionId: String
    code: String
}`;

export default [ScheduleJob];

const ScheduleJob = `
  type ScheduleJob @model {
    menteeSession: MenteeSession @relation(name: "ScheduleJobMenteeSession", direction: "OneWay")
    menteeSessionId: String
    menteeSessionUpdatedAt: String
    parent: User @relation(name: "ScheduleJobParent", direction: "OneWay")
    scheduledDate: Date
    jobType: String
    batchSessionId: String
    code: String
}`;

export default [ScheduleJob];

const ScheduleJob = `
  type ScheduleJob @model {
    menteeSession: MenteeSession @relation(name: "ScheduleJobMenteeSession", direction: "OneWay")
    parent: User @relation(name: "ScheduleJobParent", direction: "OneWay")
    scheduledDate: Date
    jobType: String
    code: String
}`;

export default [ScheduleJob];

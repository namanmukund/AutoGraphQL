const ScheduleJob = `
  type ScheduleJob @model {
    menteeSession: MenteeSession @relation(name: "ScheduleJobMenteeSession", direction: "OneWay")
    scheduledDate: Date
}`;

export default [ScheduleJob];

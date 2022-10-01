const ScheduleSessionsInput = `
  input ScheduleSessionsInput {
    scheduleSessionType: ScheduleSessionType
    adhocSessionType: AdhocSessionType
    scheduleSessionsRules: [ScheduleSessionsRule]
    sessionMode: ClassMode
    startDate: Date
    endDate: Date
    batchId: String
    courseId: String
    topicId: String
    forceShiftSessions: Boolean @defaultValue(value: "false")
    forceScheduleSessions: Boolean @defaultValue(value: "false")
    isRecurring: Boolean @defaultValue(value: "false")
    doReschedule: Boolean @defaultValue(value: "false")
    adhocSessionId: String
    batchSessionId: String
  }
`;

export default [ScheduleSessionsInput];

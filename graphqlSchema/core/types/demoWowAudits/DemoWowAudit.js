const DemoWowAudit = `
  type DemoWowAudit @model {
    auditor: User @relation(name: "UserDemoWowAudit", direction: "OneWay")
    mentorMenteeSession: MentorMenteeSession @relation(name: "MentorMenteeSessionDemoWowAudit", direction: "OneWay")
    status: MentorMenteeSessionAuditStatus @defaultValue(value: "allotted")
    auditQuestions: [MentorAuditQuestion]
    timestampAnswer: [MentorMenteeSessionTimestamp] @relation(name: "DemoWowAuditTimestamp")
    overallClassComment: String
    score: Float
    customScore: Float
    totalScore: Float
    customSectionScore: [CustomSectionScore]
    auditCompletedOn: Date
}`;

export default [DemoWowAudit];

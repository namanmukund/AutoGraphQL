import { TMS } from '../../../../constants';

const postSalesAuditQuestion = `
type PostSalesAuditQuestion {
   auditQuestion: AuditQuestion @relation(name: "PostSalesAuditQuestion", direction: "OneWay")
   mcqAnswers: [McqAnswer]
   boolAnswers: Boolean
   inputAnswer: String
   ratingAnswer: Int
   customScore: Int
 }`;

const PostSalesAudit = `
  type PostSalesAudit @model
  @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: "*" }
      ]
    rule: allow
  ){
    postSalesUser: User @relation(name: "UserPostSalesUser", direction: "OneWay")
    mentorMenteeSession: MentorMenteeSession! @relation(name: "MentorMenteeSessionPostSalesAudit", direction: "OneWay")
    auditor: User @relation(name: "UserPostSalesAudit", direction: "OneWay")
    status: SessionStatus @defaultValue(value: "allotted")
    auditQuestions: [PostSalesAuditQuestion]
    timestampAnswer: [MentorMenteeSessionTimestamp] @relation(name: "PreSalesAuditTimestamp")
    overallClassComment: String
    score: Float
    customScore: Float
    totalScore: Float
    auditAudioFile: File @relation(name: "PostSalesAuditAudioFile", direction: "OneWay")
    customSectionScore: [CustomSectionScore]
    auditCompletedOn: Date
}`;

export default [PostSalesAudit, postSalesAuditQuestion];

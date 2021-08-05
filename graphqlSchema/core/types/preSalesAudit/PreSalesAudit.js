import { TMS } from '../../../../constants';

const preSalesAuditQuestion = `
type PreSalesAuditQuestion {
   auditQuestion: AuditQuestion @relation(name: "PreSalesAuditQuestion", direction: "OneWay")
   mcqAnswers: [McqAnswer]
   mcqOptions: [McqOption]
   boolAnswers: Boolean
   inputAnswer: String
   ratingAnswer: Int
   maxRating: Int
   timestampTags: [TimestampTag]
 }`;

const PreSalesAudit = `
  type PreSalesAudit @model
  @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: "*" }
      ]
    rule: allow
  ){
    preSalesUser: User! @relation(name: "UserPreSalesUser", direction: "OneWay")
    auditor: User @relation(name: "UserPreSalesAudit", direction: "OneWay")
    client: User! @relation(name: "UserPreSalesClient", direction: "OneWay")
    status: SessionStatus @defaultValue(value: "allotted")
    auditQuestions: [PreSalesAuditQuestion]
    timestampAnswer: [MentorMenteeSessionTimestamp] @relation(name: "PreSalesAuditTimestamp")
    finalComment: String
    score: Float
}`;

export default [PreSalesAudit, preSalesAuditQuestion];

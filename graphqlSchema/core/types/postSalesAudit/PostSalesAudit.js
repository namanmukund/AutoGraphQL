import { TMS } from '../../../../constants';

const postSalesAuditQuestion = `
type PostSalesAuditQuestion {
   auditQuestion: AuditQuestion @relation(name: "PostSalesAuditQuestion", direction: "OneWay")
   mcqAnswers: [McqAnswer]
   mcqOptions: [McqOption]
   boolAnswers: Boolean
   inputAnswer: String
   ratingAnswer: Int
   maxRating: Int
   timestampTags: [TimestampTag]
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
    client: User @relation(name: "UserPostSalesClient", direction: "OneWay")
    status: SessionStatus @defaultValue(value: "allotted")
    auditQuestions: [PostSalesAuditQuestion]
    timestampAnswer: [MentorMenteeSessionTimestamp] @relation(name: "PreSalesAuditTimestamp")
    finalComment: String
    score: Float
}`;

export default [PostSalesAudit, postSalesAuditQuestion];

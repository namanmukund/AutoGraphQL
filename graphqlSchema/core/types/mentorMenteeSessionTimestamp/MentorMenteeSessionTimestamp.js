const timestampComment = `
   startTime: Int
   endTime: Int
   isTrainingMaterial: Boolean
   comment: String
   isGood: Boolean
   needWork: Boolean
`;

const tags = `
   classOpening: Boolean
   videoDiscussion: Boolean
   conceptExplaination: Boolean
   clearingDoubts: Boolean
   chatSection: Boolean
   practiceSession: Boolean
   example: Boolean
   codingExercise: Boolean
   activityBriefing: Boolean
   parentCounselling: Boolean
   enthusiasm: Boolean
   engaging: Boolean
   dedication: Boolean
   patience: Boolean
   creativity: Boolean
   friendliness: Boolean
   flexibility: Boolean
   senseOfHumor: Boolean
   inspiring: Boolean
   distracted: Boolean
   rude: Boolean
   dormant: Boolean
   annoying: Boolean
`;

const MentorMenteeSessionTimestamp = `
  type MentorMenteeSessionTimestamp @model {
    auditDocument: MentorMenteeSessionAudit @relation(name: "MentorMenteeSessionAuditTimestamp")
    preSalesDocument: PreSalesAudit @relation(name: "PreSalesAuditTimestamp")
    postSalesDocument: PostSalesAudit @relation(name: "PostSalesAuditTimestamp")
    demoWowDocument: DemoWowAudit @relation(name: "DemoWowAuditTimestamp")
    auditQuestion: AuditQuestion @relation(name: "MentorMenteeSessionTimestampAuditQuestion", direction: "OneWay")
    ${timestampComment}
    ${tags}
    customScore: Int
    answerTimestampTags: [TimestampTag]
}`;

export default [MentorMenteeSessionTimestamp];

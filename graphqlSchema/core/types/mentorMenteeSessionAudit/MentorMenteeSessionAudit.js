const interpersonalSkills = `
    enthusiasm: Int @length(min: 0, max: 10)
    friendliness: Int @length(min: 0, max: 10)
    engagement: Int @length(min: 0, max: 10)
    patience: Int @length(min: 0, max: 10)
    inspiring: Int @length(min: 0, max: 10)
    creativity: Int @length(min: 0, max: 10)
    dedication: Int @length(min: 0, max: 10)
    flexibility: Int @length(min: 0, max: 10)
`;

const classQuality = `
    classOpeningScore: Int @length(min: 0, max: 10)
    conceptsExplainedScore: Int @length(min: 0, max: 10)
    activityBriefingScore: Int @length(min: 0, max: 10)
    codingExerciseScore: Int @length(min: 0, max: 10)
    videoDiscussionScore: Int @length(min: 0, max: 10)
    productWalkthroughScore: Int @length(min: 0, max: 10)
    chatSectionScore: Int @length(min: 0, max: 10)
    parentCounsellingScore: Int @length(min: 0, max: 10)
    practiceSectionScore: Int @length(min: 0, max: 10)
`;

const processMonitoring = `
    isEpisodeExplained: Boolean
    isVideoWatchedInFullScreen: Boolean
    askedQuestionAroundEpisode: Boolean
    clarifiedDoubts: Boolean
    notClarifiedDoubtsComment: String
    briefedChat: Boolean
    easilyAnsweredQuiz: Boolean
    reportExplainedProperly: Boolean
    usedCodePlayground: Boolean
    notUsedCodePlaygroundComment: String
    coveredAllCases: Boolean
    notCoveredAllCasesComment: String
    concludedSession: Boolean
    screenShareStoppedWhileRating: Boolean
    coveredHomework: Boolean
    offeredCounselling: Boolean
`;

const mentorAuditQuestion = `
type MentorAuditQuestion {
   auditQuestion: AuditQuestion @relation(name: "MentorAuditQuestion", direction: "OneWay")
   mcqAnswers: [McqAnswer]
   boolAnswers: Boolean
   inputAnswer: String
   ratingAnswer: Int
   customScore: Int
 }`;

const customSectionScore = `
type CustomSectionScore {
   questionSection: AuditQuestionSection @relation(name: "AuditQuestionSectionCustomScore", direction: "OneWay")
   customScore: Int
 }`;

const codingExercise = `
    isStudentProperlyHelped: Boolean
    isProactive: Boolean
    encouragedKid: Boolean
    rushed: Boolean
`;

const MentorMenteeSessionAudit = `
  type MentorMenteeSessionAudit @model {
    auditor: User @relation(name: "UserMentorMenteeSessionAudit", direction: "OneWay")
    mentorMenteeSession: MentorMenteeSession! @relation(name: "SessionDataMenteeSessionAudit", direction: "OneWay")
    status: MentorMenteeSessionAuditStatus @defaultValue(value: "allotted")
    ${classQuality}
    ${interpersonalSkills}
    ${processMonitoring}
    ${codingExercise}
    noiseDisturbanceFromMentor: Boolean
    isStudentCameraOff: Boolean
    switchedToComfortableLanguage: Boolean
    isMentorInternetDecent: Boolean
    auditQuestions: [MentorAuditQuestion]
    timestampAnswer: [MentorMenteeSessionTimestamp] @relation(name: "MentorMenteeSessionAuditTimestamp")
    overallClassComment: String
    score: Float
    customSectionScore: [CustomSectionScore]
}`;

export default [MentorMenteeSessionAudit, mentorAuditQuestion, customSectionScore];

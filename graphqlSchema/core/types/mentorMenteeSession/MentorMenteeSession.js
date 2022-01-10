const sendTransactionalMessageFields = `
    sendSessionLink: Boolean
    didNotPickTheCall: Boolean
    sessionNotConducted: Boolean
    didNotTurnUpInSession: Boolean
`;

const sessionRescheduledReasons = `
    hasRescheduled: Boolean
    rescheduledDate: Date
    rescheduledDateProvided: Boolean
    internetIssue: Boolean
    zoomIssue: Boolean
    laptopIssue: Boolean
    chromeIssue: Boolean
    powerCut: Boolean
    notResponseAndDidNotTurnUp: Boolean
    turnedUpButLeftAbruptly: Boolean
    hadOtherCommitments: Boolean
    classDurationExceeded: Boolean
    leadNotVerifiedProperly: Boolean
    otherReasonForReschedule: Boolean
    otherReasonForChallenges: String
    webSiteLoadingIssue: Boolean
    videoNotLoading: Boolean
    codePlaygroundIssue: Boolean
    logInOTPError: Boolean
    otherTechnicalReason: Boolean
    languageBarrier: Languages
    otherLanguageBarrier: String
`;

const studentUnderstandingFields = `
  attentionLevel: Int @length(min: 1, max: 10)
  previousSessionUnderstandingLevel: Int @length(min: 1, max: 10)
  currentSessionUnderstandingLevel: Int @length(min: 1, max: 10)
`;

const studentAbilityFields = `
  learningSpeed: Int @length(min: 1, max: 5)
  analyticSkills: Int @length(min: 1, max: 5)
  problemSolvingAbility: Int @length(min: 1, max: 5)
  interestInLearning: Int @length(min: 1, max: 5)
  eagerness: Int @length(min: 1, max: 5)
`;

const internetSpeed = `
  type InternetSpeed {
   speed: Float
   unit: InternetSpeedUnit
}`;

const MentorMenteeSession = `
  type MentorMenteeSession @model {
    course: Course @relation(name: "MentorMenteeSessionCourse", direction: "OneWay")
    topic: Topic! @relation(name: "MentorMenteeSessionTopic", direction: "OneWay")
    menteeSession: MenteeSession! @relation(name: "SessionDataMenteeSession", direction: "OneWay")
    mentorSession: MentorSession @relation(name: "SessionDataMentorSession")
    salesOperation: SalesOperation @relation(name:"SalesOperationFirstMentorMenteeSession")
    sessionAllotmentDate: Date
    sessionStartDate: Date
    sessionEndDate: Date
    sessionStatus: SessionStatus! @defaultValue(value: "allotted")
    classMissedMessageStatus: ClassMissedMessageStatus @defaultValue(value: "pending")
    isQuizSubmitted: Boolean @defaultValue(value: "false")
    quizSubmitDate: Date
    isPracticeSubmitted: Boolean @defaultValue(value: "false")
    practiceSubmitDate: Date
    isAssignmentSubmitted: Boolean @defaultValue(value: "false")
    isReviewSubmittedOnTime: Boolean @defaultValue(value: "false")
    assignmentSubmitDate: Date
    isHomeworkCheckedByMentor: Boolean @defaultValue(value: "false")
    isSubmittedForReview: Boolean @defaultValue(value: "false")
    friendly: Boolean
    motivating: Boolean
    engaging: Boolean
    helping: Boolean
    enthusiastic: Boolean
    patient: Boolean
    conceptsPerfectlyExplained: Boolean
    distracted: Boolean
    rude: Boolean
    slowPaced: Boolean
    fastPaced: Boolean
    notPunctual: Boolean
    average: Boolean
    boring: Boolean
    poorExplanation: Boolean
    averageExplanation: Boolean
    comment: String
    rating: Int @length(min: 1, max: 5) @groupBy
    sessionRecordingLink: String
    ${sendTransactionalMessageFields} 
    ${sessionRescheduledReasons}
    ${studentUnderstandingFields}
    ${studentAbilityFields}
    isFeedbackSubmitted: Boolean @defaultValue(value: "false")
    sessionCommentByMentor: String
    source: UserOriginSource @defaultValue(value: "website")
    country: Country @defaultValue(value: "india")
    internetSpeed: InternetSpeed
    leadStatus: LeadStatus @groupBy
    mentorPaymentStatus: MentorPaymentStatus @defaultValue(value: "declined")
    mentorPaymentJustification: String
    paymentApprovedBy: User @relation(name: "MentorMenteeSessionPaymentApprovedUser", direction: "OneWay")
    isAudit: Boolean @defaultValue(value: "false")
    isPostSalesAudit: Boolean @defaultValue(value: "false")
    studentProfile: StudentProfile @relation(name:"MentorMenteeSessionStudentProfile", direction: "OneWay")
    mentorAvailabilitySlot: MentorAvailabilitySlot @relation(name:"MentorAvailabilitySlotMentorMenteeSession")
    isBroadCastedSession: Boolean @defaultValue(value: "false")
    videoLinkClickByMentor: Date
    videoLinkClickByMentee: Date
    startSessionByMentee: Date
    endSessionByMentee: Date
    mentorStartAttendance: Date
    mentorSavesAttendance: Date
    videoLinkClickByMenteePlatform: Platform
    startSessionByMenteePlatform: Platform
    isDemoWowAudit: Boolean @defaultValue(value: "false")
    bookingAgent: User @relation(name: "MentorMenteeSessionBookingAgent", direction: "OneWay")
    verificationStatus: VerificationStatus @defaultValue(value: "unverified")
    verifiedBy: User @relation(name: "MentorMenteeSessionVerifiedBy", direction: "OneWay")
}`;

export default [MentorMenteeSession, internetSpeed];

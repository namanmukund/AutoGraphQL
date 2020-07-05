const MentorMenteeSession = `
  type MentorMenteeSession @model {
    topic: Topic! @relation(name: "MentorMenteeSessionTopic", direction: "OneWay")
    menteeSession: MenteeSession! @relation(name: "SessionDataMenteeSession", direction: "OneWay")
    mentorSession: MentorSession! @relation(name: "SessionDataMentorSession", direction: "OneWay")
    sessionStartDate: Date
    sessionEndDate: Date
    sessionStatus: SessionStatus! @defaultValue(value: "started")
    isQuizSubmitted: Boolean @defaultValue(value: "false")
    quizSubmitDate: Date
    isAssignmentSubmitted: Boolean @defaultValue(value: "false")
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
    rating: Int
}`;

export default [MentorMenteeSession];

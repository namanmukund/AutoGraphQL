const MenteeCourseHomework = `
  type MenteeCourseHomework {
    sessionStatus: SessionStatus! @defaultValue(value: "allotted")
    assignmentSubmitDate: Date
    quizSubmitDate: Date
    isSubmittedForReview: Boolean @defaultValue(value: "false")
    sessionJoinedByMenteeAt: Date
    isQuizSubmitted: Boolean @defaultValue(value: "false")   
    isAssignmentSubmitted: Boolean @defaultValue(value: "false")
    isAssignmentAttempted: Boolean @defaultValue(value: "false") 
    isPracticeSubmitted: Boolean @defaultValue(value: "false")
    practiceSubmitDate: Date
    isHomeworkCheckedByMentor: Boolean @defaultValue(value: "false")
    isReviewSubmittedOnTime: Boolean @defaultValue(value: "false")
    mentorMenteeSessionAvailable: Boolean @defaultValue(value: "false")
    topic: Topic! @relation(name: "MentorMenteeSessionTopic", direction: "OneWay")
}`;

export default [MenteeCourseHomework];

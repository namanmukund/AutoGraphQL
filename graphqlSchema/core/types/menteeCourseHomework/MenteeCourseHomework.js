const MenteeCourseHomeworkTopicChapter = `
type MenteeCourseHomeworkTopicChapter{
  id: ID
  title: String
  order: Int
}
`;

const MenteeCourseHomeworkTopic = `
  type MenteeCourseHomeworkTopic{
    order: Int! 
    title: String!  @trim
    description: String @trim
    status: ContentStatus!
    video: File
    videoTitle: String @uniqueOrEmpty @trim
    videoDescription: String @uniqueOrEmpty @trim
    videoSubtitle: File
    videoThumbnail: File
    videoStatus: ContentStatus! @defaultValue(value: "unpublished")
    videoStartTime: Int
    isQuestionInMessageEnabled: Boolean @defaultValue(value: "false")
    videoEndTime: Int
    storyStartTime: Int
    storyEndTime: Int
    storyThumbnail: File
    learningObjectives: [LearningObjective]
    questions: [QuestionBank]
    topicQuestions: [TopicQuestion]
    topicAssignmentQuestions: [TopicAssignmentQuestion]
    topicHomeworkAssignmentQuestion: [TopicAssignmentQuestion]
    badges: [Badge]
    thumbnail: File
    thumbnailSmall: File
    isTrial: Boolean @defaultValue(value: "false")
    assignmentQuestions: [AssignmentQuestion]
    bulletPoints: [BulletPoint]
    courses: [Course]
    blockBasedProjects: [BlockBasedProject]
    videoContent: [Video]
    topicComponentRule: [TopicComponentsRule]
    tools: [ArrayValue]
    programming: [ArrayValue]
    theory: [ArrayValue]
    learningSlides: [LearningSlide]
    classType: ClassType @defaultValue(value: "lab")
    chapter:MenteeCourseHomeworkTopicChapter
  }
`;

const MenteeCourseHomework = `
  type MenteeCourseHomework {
    id: ID
    sessionStatus: SessionStatus @defaultValue(value: "allotted")
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
    topic: MenteeCourseHomeworkTopic
}`;

export default [MenteeCourseHomework, MenteeCourseHomeworkTopic, MenteeCourseHomeworkTopicChapter];

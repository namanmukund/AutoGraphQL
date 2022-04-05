const practiceQuestionsUserActivityLearningSlideType = `
  type practiceQuestionsUserActivityLearningSlideType {
    question: QuestionBank @relation(name: "QuestionUserActivityLearningSlideDump", direction: "OneWay")
    questionAction: UserActionType
    questionDisplayOrder: Int
    isCorrect: Boolean
    isHintUsed: Boolean @defaultValue(value: "false")
    isAnswerUsed: Boolean @defaultValue(value: "false")
    isRecommendationUsed: Boolean @defaultValue(value: "false")
    attemptNumber: Int @defaultValue(value: 0)
    userMcqAnswer: [McqAnswer]
    userFibInputAnswer: [FibInputAnswer]
    userFibBlockAnswer: [FibBlocksAnswer]
    userArrangeAnswer: [ArrangeAnswer]
 }`;

const UserActivityLearningSlideDump = `
  type UserActivityLearningSlideDump @model
  {
    status: ContentStatus
    user: User! @relation(name: "UserActivityLearningSlideDump", direction: "OneWay")
    learningSlide: LearningSlide @relation(name: "UserActivityLearningSlideDumpLearningSlide", direction: "OneWay")
    pqAction: UserActionType
    type: LearningSlideType
    isBookmarked: Boolean
    learningObjective: LearningObjective! @relation(name: "LearningObjectiveUserActivityLearningSlideDump", direction: "OneWay")
    practiceQuestions: [practiceQuestionsUserActivityLearningSlideType]
    topic: Topic @relation(name: "TopicUserActivityLearningSlideDump", direction: "OneWay")
    course: Course @relation(name: "UserActivityLearningSlideDumpCourse", direction: "OneWay")
  }
`;

export default [UserActivityLearningSlideDump, practiceQuestionsUserActivityLearningSlideType];

const LearningObjective = `
  type LearningObjective @model {
    order: Int!
    title: String! @unique @length(min: 6, max: 120) @trim
    description: String @uniqueOrEmpty @unique @length(min: 6, max: 120) @trim
    videoStartTime: Int
    videoEndTime: Int
    topic: Topic @relation(name: "TopicLearningObjective")
    messages: [Message] @relation(name: "LearningObjectiveMessage", isSubset: true)
    questionBank: [QuestionBank] @relation(name: "LearningObjectiveQuestionBank", isSubset: true)
    status: ContentStatus! @defaultValue(value: "unpublished")
    thumbnail: File @relation(name: "LearningObjectiveThumbnail", direction: "OneWay")
    messageStatus: ContentStatus! @defaultValue(value: "unpublished")
    testQuizLO: UserActivityDump @relation(name: "QuizLo")
    testNoFieldsInParalleltwo1to1U: [UserActivityDump] @relation(name: "RTestNoFieldsInParalleltwo1to1")
    testNoFieldsInParalleltwo1tomU: UserActivityDump @relation(name: "RTestNoFieldsInParalleltwo1tom")
    testNoFieldsInParalleltwo1to1UA: UserActivityDump @relation(name: "RTestNoFieldsInParalleltwo1to1A")
    testNoFieldsInParalleltwo1tomUA: UserActivityDump @relation(name: "RTestNoFieldsInParalleltwo1tomA")
  }
`;

export default LearningObjective;

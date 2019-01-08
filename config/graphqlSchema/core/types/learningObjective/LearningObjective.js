const LearningObjective = `
  type LearningObjective @model {
    order: Int!
    title: String! @unique
    description: String @unique
    createdAt: Date @readOnly
    updatedAt: Date @readOnly
    videoStartTime: Int
    videoEndTime: Int
    topic: Topic @relation(name: "TopicLearningObjective")
    techTalk: TechTalk @relation(name: "LearningObjectiveTechTalk" isSubset: true)
    practiceQuestions: [QuestionBank] @relation(name: "LearningObjectivePracticeQuestion")
    status: ContentStatus! @defaultValue(value: "unpublished")
    thumbnail: File @relation(name: "LearningObjectiveThumbnail", direction: "OneWay")
  }
`;

export default LearningObjective;

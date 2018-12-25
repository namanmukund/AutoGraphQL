const Topic = `
  type Topic @model {
    order: Int! @unique
    code: String @auto
    title: String! @unique
    description: String @unique
    status: ContentStatus! @defaultValue(value: "unpublished")
    createdAt: Date @readOnly
    updatedAt: Date @readOnly
    library: Library @relation(name: "LibraryTopic")
    chapter: Chapter @relation(name: "ChapterTopic")
    learningObjectives: [LearningObjective] @relation(name: "LearningObjectiveTopic")
    conceptCards: [ConceptCard] @relation(name: "ConceptCardTopic")
    quiz: [QuestionBank] @relation(name: "QuestionBankTopic")
    image: File @relation(name: "TopicImage", direction: "OneWay")
    video: File @relation(name: "TopicVideo", direction: "OneWay")
  }
`;

export default Topic;

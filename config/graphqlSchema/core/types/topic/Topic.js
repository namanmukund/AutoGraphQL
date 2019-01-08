const Topic = `
  type Topic @model {
    order: Int! @unique
    title: String! @unique
    description: String @unique
    status: ContentStatus! @defaultValue(value: "unpublished")
    createdAt: Date @readOnly
    updatedAt: Date @readOnly
    chapter: Chapter @relation(name: "ChapterTopic")
    learningObjectives: [LearningObjective] @relation(name: "TopicLearningObjective", isSubset: true)
    quiz: [QuestionBank] @relation(name: "TopicQuiz")
    episode: Episode @relation(name: "TopicEpisode")
    thumbnail: File @relation(name: "TopicThumbnail", direction: "OneWay")
  }
`;

export default Topic;

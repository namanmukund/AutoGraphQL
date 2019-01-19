const Topic = `
  type Topic @model {
    order: Int! @unique
    title: String! @unique
    description: String @uniqueOrEmpty
    status: ContentStatus! @defaultValue(value: "unpublished")
    video: File @relation(name: "TopicVideo", direction: "OneWay")
    videoTitle: String @uniqueOrEmpty
    videoDescription: String @uniqueOrEmpty
    videoSubtitle: File @relation(name: "VideoSubtitle", direction: "OneWay")
    videoThumbnail: File @relation(name: "VideoThumbnail", direction: "OneWay")
    createdAt: Date @readOnly
    updatedAt: Date @readOnly
    chapter: Chapter @relation(name: "ChapterTopic")
    learningObjectives: [LearningObjective] @relation(name: "TopicLearningObjective", isSubset: true)
    questions: [QuestionBank] @relation(name: "TopicQuestionBank")
    thumbnail: File @relation(name: "TopicThumbnail", direction: "OneWay")
  }
`;

export default Topic;

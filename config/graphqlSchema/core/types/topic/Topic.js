const Topic = `
  type Topic @model {
    order: Int! @unique @length(min: 1, max: 50)
    title: String! @unique @length(min: 6, max: 120) @trim
    description: String @uniqueOrEmpty @length(min: 6, max: 120) @trim
    status: ContentStatus! @defaultValue(value: "unpublished")
    video: File @relation(name: "TopicVideo", direction: "OneWay")
    videoTitle: String @uniqueOrEmpty @length(min: 6, max: 120) @trim
    videoDescription: String @uniqueOrEmpty @length(min: 6, max: 120) @trim
    videoSubtitle: File @relation(name: "VideoSubtitle", direction: "OneWay")
    videoThumbnail: File @relation(name: "VideoThumbnail", direction: "OneWay")
    videoStatus: ContentStatus! @defaultValue(value: "unpublished")
    chapterTesting: Chapter @relation(name: "ChapterTopic")
    learningObjectives: [LearningObjective] @relation(name: "TopicLearningObjective", isSubset: true)
    questions: [QuestionBank] @relation(name: "TopicQuestionBank")
    thumbnail: File @relation(name: "TopicThumbnail", direction: "OneWay")
  }
`;

export default Topic;

const Topic = `
  type Topic @model {
    order: Int! @unique
    title: String! 
        @unique 
        @trim
    description: String @uniqueOrEmpty @trim
    status: ContentStatus! @defaultValue(value: "unpublished")
    video: File @relation(name: "TopicVideo", direction: "OneWay")
    videoTitle: String @uniqueOrEmpty @trim
    videoDescription: String @uniqueOrEmpty @trim
    videoSubtitle: File @relation(name: "VideoSubtitle", direction: "OneWay")
    videoThumbnail: File @relation(name: "VideoThumbnail", direction: "OneWay")
    videoStatus: ContentStatus! @defaultValue(value: "unpublished")
    videoStartTime: Int
    videoEndTime: Int
    storyStartTime: Int
    storyEndTime: Int
    storyThumbnail: File @relation(name: "StoryThumbnail", direction: "OneWay")
    chapter: Chapter @relation(name: "ChapterTopic")
    learningObjectives: [LearningObjective] @relation(name: "TopicLearningObjective", isSubset: true)
    questions: [QuestionBank] @relation(name: "TopicQuestionBank")
    badges: [Badge] @relation(name: "TopicBadge", isSubset: true)
    thumbnail: File @relation(name: "TopicThumbnail", direction: "OneWay")
    isTrial: Boolean @defaultValue(value: "false")
  }
`;

export default Topic;

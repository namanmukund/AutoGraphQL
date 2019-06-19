const Chapter = `
  type Chapter @model {
    order: Int! @unique
    title: String! @unique @trim
    description: String @uniqueOrEmpty @trim
    status: ContentStatus! @defaultValue(value: "unpublished")
    topics: [Topic] @relation(name: "ChapterTopic", isSubset: true)
    thumbnail: File @relation(name: "ChapterThumbnail", direction: "OneWay")
    courses: [Course] @relation(name: "CourseChapter")
  }
`;

export default Chapter;

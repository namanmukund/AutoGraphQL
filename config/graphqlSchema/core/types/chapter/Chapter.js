const Chapter = `
  type Chapter @model {
    order: Int! @unique @length(min: 1, max: 100)
    title: String! @unique @length(min: 6, max: 120) @trim
    description: String @uniqueOrEmpty @length(min: 6, max: 120) @trim
    status: ContentStatus! @defaultValue(value: "unpublished")
    topics: [Topic] @relation(name: "ChapterTopic", isSubset: true)
    thumbnail: File @relation(name: "ChapterThumbnail", direction: "OneWay")
    courses: [Course] @relation(name: "CourseChapter")
  }
`;

export default Chapter;

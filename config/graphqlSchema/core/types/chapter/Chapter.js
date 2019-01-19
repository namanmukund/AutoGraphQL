const Chapter = `
  type Chapter @model {
    order: Int! @unique
    title: String! @unique
    description: String @uniqueOrEmpty
    status: ContentStatus! @defaultValue(value: "unpublished")
    createdAt: Date @readOnly
    updatedAt: Date @readOnly
    topics: [Topic] @relation(name: "ChapterTopic", isSubset: true)
    thumbnail: File @relation(name: "ChapterThumbnail", direction: "OneWay")
  }
`;

export default Chapter;

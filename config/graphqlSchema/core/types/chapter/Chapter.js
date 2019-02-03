const Chapter = `
  type Chapter @model {
    order: Int! @unique @length(min: 1, max: 10)
    title: String! @unique @length(min: 6, max: 120)
    description: String @uniqueOrEmpty @length(min: 6, max: 120)
    status: ContentStatus! @defaultValue(value: "unpublished")
    createdAt: Date @readOnly
    updatedAt: Date @readOnly
    topics: [Topic] @relation(name: "ChapterTopic", isSubset: true)
    thumbnail: File @relation(name: "ChapterThumbnail", direction: "OneWay")
  }
`;

export default Chapter;

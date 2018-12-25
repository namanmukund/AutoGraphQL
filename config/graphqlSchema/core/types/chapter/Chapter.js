const Chapter = `
  type Chapter @model {
    order: Int! @unique
    code: String @auto
    title: String! @unique
    description: String @unique
    status: ContentStatus! @defaultValue(value: "unpublished")
    createdAt: Date @readOnly
    updatedAt: Date @readOnly
    library: Library @relation(name: "LibraryChapter")
    topics: [Topic] @relation(name: "ChapterTopic" isSubset: true)
    image: File @relation(name: "ChapterImage", direction: "OneWay")
  }
`;

export default Chapter;

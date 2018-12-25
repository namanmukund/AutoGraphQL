const Library = `
  type Library @model {
    order: Int! @unique
    code: String @auto
    title: String! @unique
    description: String @unique
    status: ContentStatus! @defaultValue(value: "unpublished")
    createdAt: Date @readOnly
    updatedAt: Date @readOnly
    chapters: [Chapter] @relation(name: "LibraryChapter" isSubset: true)
    topics: [Topic] @relation(name: "LibraryTopic")
    image: File @relation(name: "LibraryImage", direction: "OneWay")
  }
`;

export default Library;

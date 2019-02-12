const Subject = `
  type Subject @model {
    order: Int
    title: SubjectTitle! @defaultValue(value: "python")
    category: SubjectCategory
    description: String @uniqueOrEmpty @length(min: 6, max: 120) @trim
    status: ContentStatus! @defaultValue(value: "unpublished")
    chapters: [Chapter] @relation(name: "SubjectChapter")
    thumbnail: File @relation(name: "SubjectThumbnail", direction: "OneWay")
  }
`;

export default Subject;

const Course = `
  type Course @model {
    order: Int
    title: CourseTitle!
    category: CourseCategory!
    description: String @uniqueOrEmpty @length(min: 6, max: 120) @trim
    status: ContentStatus! @defaultValue(value: "unpublished")
    chapters: [Chapter] @relation(name: "CourseChapter")
    thumbnail: File @relation(name: "CourseThumbnail", direction: "OneWay")
  }
`;

export default Course;

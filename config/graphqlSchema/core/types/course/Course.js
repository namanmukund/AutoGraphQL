import { TLA, TMS } from '../../../../../constants';
import { READ } from '../../../../../constants/graphqlOperations';

const Course = `
  type Course @model 
  @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: "*" },
      { appName: "${TLA}" operations: ${READ} }], 
    rule: allow
  )
  {
    order: Int
    title: CourseTitle! @unique
    category: CourseCategory!
    description: String @uniqueOrEmpty @length(min: 6, max: 120) @trim
    status: ContentStatus! @defaultValue(value: "unpublished")
    chapters: [Chapter] @relation(name: "CourseChapter")
    thumbnail: File @relation(name: "CourseThumbnail", direction: "OneWay")
  }
`;

export default Course;

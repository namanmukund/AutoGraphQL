import { READ } from '../../../../constants/graphqlOperations';
import { TLA, TMS, TWA } from '../../../../constants';
import { CMS_HEAD, NOT_CMS_HEAD, SCHOOL_ADMIN } from '../../../../constants/roles';

const Course = `
  type Course @model 
  @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: "*" },
      { appName: "${TLA}" operations: ${READ} },
      { appName: "${TWA}" operations: ${READ} }
      ], 
    rule: allow
  )
  @userPermissions(
    permissions:[
      { userRole: ${CMS_HEAD} appName: "*" operations: "*" },
      { userRole: ${NOT_CMS_HEAD} appName: "*" operations: ${READ} }
      { userRole: ${SCHOOL_ADMIN} appName: "*" operations: "*" }
      ], 
    rule: allow
  ) 
  {
    order: Int
    title: CourseTitle! @unique
    category: CourseCategory!
    description: String @uniqueOrEmpty @length(min: 6, max: 120) @trim
    status: ContentStatus! @defaultValue(value: "unpublished")
    chapters: [Chapter] @relation(name: "CourseChapter")
    products: [Product] @relation(name: "CourseProduct")
    mentorPricings: [MentorPricing] @relation(name: "CourseMentorPricing")
    thumbnail: File @relation(name: "CourseThumbnail", direction: "OneWay")
  }
`;

export default Course;

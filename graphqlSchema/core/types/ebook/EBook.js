import { READ } from '../../../../constants/graphqlOperations';
import { TLA, TMS, TWA } from '../../../../constants';

const EBookCourse = `
  type EBookCourse @model @databaseController(mode:"aggregation") {
   pageRangeStart: Int
   pageRangeEnd: Int
   ebook: EBook! @relation(name:"CourseEBook")
   course: Course! @relation(name: "EBookCourseCourses")
 }`;

const EbookCategory = `
 enum EbookCategory {
  coding
  computerScience
 }
`;

const EBook = `
  type EBook @model
  @databaseController(mode: "aggregation")
  @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: "*" },
      { appName: "${TLA}" operations: ${READ} },
      { appName: "${TWA}" operations: ${READ} }
      ], 
    rule: allow
  )
  {
    title: String! @trim
    description: String
    courses: [EBookCourse] @relation(name:"CourseEBook")
    thumbnail: File @relation(name: "EBookThumbnail", direction: "OneWay")
    resourceURL: String!
    grades: [Grade]
    category: EbookCategory
  }
`;

export default [EBook, EbookCategory, EBookCourse];

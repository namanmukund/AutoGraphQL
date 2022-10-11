import { READ } from '../../../../constants/graphqlOperations';
import { TLA, TMS, TWA } from '../../../../constants';

const EBookCourses = `
  type EBookCourses {
   pageRangeStart: Int
   pageRangeEnd: Int
   course: Course! @relation(name: "EBookCourse", direction: "OneWay")
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
    courses: EBookCourses
    thumbnail: File @relation(name: "EBookThumbnail", direction: "OneWay")
    resourceURL: String!
    grades: [Grade]
    category: EbookCategory
  }
`;

export default [EBook, EbookCategory, EBookCourses];

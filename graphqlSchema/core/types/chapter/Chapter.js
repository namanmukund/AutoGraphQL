import { READ } from '../../../../constants/graphqlOperations';
import { TLA, TMS, TWA } from '../../../../constants';
import { CMS_HEAD, NOT_CMS_HEAD, SCHOOL_ADMIN } from '../../../../constants/roles';

const Chapter = `
  type Chapter @model
  @databaseController(mode: "aggregation")
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
      { userRole: ${NOT_CMS_HEAD} appName: "*" operations: ${READ} },
      { userRole: ${SCHOOL_ADMIN} appName: "*" operations: ${READ} }
      ], 
    rule: allow
  ) 
    @subscribe(events: "*")
   {  
    order: Int!
    title: String! @trim
    description: String @uniqueOrEmpty @trim
    status: ContentStatus! @defaultValue(value: "unpublished")
    topics: [Topic] @relation(name: "ChapterTopic", isSubset: true)
    thumbnail: File @relation(name: "ChapterThumbnail", direction: "OneWay")
    courses: [Course] @relation(name: "CourseChapter")
  }
`;

export default Chapter;

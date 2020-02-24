import { READ } from '../../../../../constants/graphqlOperations';
import { TLA, TMS } from '../../../../../constants';

const Chapter = `
  type Chapter @model
  @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: "*" },
      { appName: "${TLA}" operations: ${READ} }], 
    rule: allow
  )
   {
    order: Int! 
    title: String! @unique @trim
    description: String @uniqueOrEmpty @trim
    status: ContentStatus! @defaultValue(value: "unpublished")
    topics: [Topic] @relation(name: "ChapterTopic", isSubset: true)
    thumbnail: File @relation(name: "ChapterThumbnail", direction: "OneWay")
    courses: [Course] @relation(name: "CourseChapter")
  }
`;

export default Chapter;

import { READ } from '../../../../constants/graphqlOperations';
import { TLA, TMS, TWA } from '../../../../constants';
import { CMS_HEAD, NOT_CMS_HEAD } from '../../../../constants/roles';

const CheatSheet = `
  type CheatSheet @model
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
      ], 
    rule: allow
  ) 
  {
    title: String! @unique @trim
    order: Int
    topic: Topic @relation(name: "TopicCheatSheet", direction: "OneWay")
    content: [CheatSheetContent] @relation(name: "CheatSheetContent", isSubset: true)
    status: ContentStatus! @defaultValue(value: "unpublished")
    tags: [ContentTag] @relation(name: "CheatSheetContentTag")
  }
`;

export default CheatSheet;

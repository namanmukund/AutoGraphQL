import { READ } from "../../../../constants/graphqlOperations";
import { TLA, TMS, TWA } from "../../../../constants";
import { CMS_HEAD, NOT_CMS_HEAD } from "../../../../constants/roles";

const Workbook = `
  type Workbook @model
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
    order: Int
    title: String! @trim
    statement: String @trim
    hint: String @trim
    difficulty: Int
    topic: Topic @relation(name: "TopicCheatSheet", direction: "OneWay")
    status: ContentStatus! @defaultValue(value: "unpublished")
    tags: [ContentTag] @relation(name: "WorkbookContentTag")
    workbookExamples: [WorkbookExample]
  }
`;

export default Workbook;

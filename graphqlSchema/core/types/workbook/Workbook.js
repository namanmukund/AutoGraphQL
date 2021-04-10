import { READ } from '../../../../constants/graphqlOperations';
import { TLA, TMS, TWA } from '../../../../constants';
import getPermissionSchemaString from '../../../../src/autoGenerate/utils/getPermissionSchemaString';

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
${getPermissionSchemaString('Workbook')}
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

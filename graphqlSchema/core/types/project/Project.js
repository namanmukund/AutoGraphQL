import { READ } from '../../../../constants/graphqlOperations';
import { TLA, TMS, TWA } from '../../../../constants';
import getPermissionSchemaString from '../../../../src/autoGenerate/utils/getPermissionSchemaString';

const Project = `
  type Project @model
  @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: "*" },
      { appName: "${TLA}" operations: ${READ} },
      { appName: "${TWA}" operations: ${READ} }
      ], 
    rule: allow
  ) 
  ${getPermissionSchemaString('Project')}
  {
    title: String! @unique @trim
    order: Int
    topic: Topic @relation(name: "TopicCheatSheet", direction: "OneWay")
    content: [ProjectContent] @relation(name: "ProjectContent", isSubset: true)
    status: ContentStatus! @defaultValue(value: "unpublished")
  }
`;

export default Project;

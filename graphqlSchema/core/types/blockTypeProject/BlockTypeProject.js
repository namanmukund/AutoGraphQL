import { READ } from '../../../../constants/graphqlOperations';
import { TLA, TMS, TWA } from '../../../../constants';
import getPermissionSchemaString from '../../../../src/autoGenerate/utils/getPermissionSchemaString';

const BlockTypeProject = `
  type BlockTypeProject @model
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
    title: String! @trim
    order: Int
    statement: String @trim
    difficulty: Int
    projectDescription: String @trim
    projectThumbnail: File @relation(name: "BlockTypeProjectThumbnail", direction: "OneWay")
    answerDescription: String @trim
    answerThumbnail: File @relation(name: "BlockTypeProjectAnswerThumbnail", direction: "OneWay")
    topics: [Topic] @relation(name: "TopicBlockTypeProject")
    status: ContentStatus! @defaultValue(value: "unpublished")
  }
`;

export default BlockTypeProject;

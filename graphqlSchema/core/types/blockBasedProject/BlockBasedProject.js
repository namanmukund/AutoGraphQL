import { READ } from '../../../../constants/graphqlOperations';
import { TLA, TMS, TWA } from '../../../../constants';
import getPermissionSchemaString from '../../../../src/autoGenerate/utils/getPermissionSchemaString';

const BlockBasedProject = `
  type BlockBasedProject @model
  @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: "*" },
      { appName: "${TLA}" operations: ${READ} },
      { appName: "${TWA}" operations: ${READ} }
      ], 
    rule: allow
  ) 
  ${getPermissionSchemaString('BlockBasedProject')}
  {
    title: String! @trim
    order: Int
    statement: String @trim
    difficulty: Int
    projectDescription: String @trim
    projectThumbnail: File @relation(name: "BlockBasedProjectThumbnail", direction: "OneWay")
    answerDescription: String @trim
    answerThumbnail: File @relation(name: "BlockBasedProjectAnswerThumbnail", direction: "OneWay")
    topics: [Topic] @relation(name: "TopicBlockBasedProject")
    status: ContentStatus! @defaultValue(value: "unpublished")
  }
`;

export default BlockBasedProject;

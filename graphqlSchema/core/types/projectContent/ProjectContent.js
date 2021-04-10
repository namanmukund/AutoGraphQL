import { READ } from '../../../../constants/graphqlOperations';
import { TLA, TMS, TWA } from '../../../../constants';
import getPermissionSchemaString from '../../../../src/autoGenerate/utils/getPermissionSchemaString';

const ProjectContent = `
  type ProjectContent @model
  @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: "*" },
      { appName: "${TLA}" operations: ${READ} },
      { appName: "${TWA}" operations: ${READ} }
      ], 
    rule: allow
  ) 
  ${getPermissionSchemaString('ProjectContent')}
  {
    order: Int!
    type: CheatSheetType!
    statement: String @trim
    emoji: [StickerEmoji] @relation(name: "ProjectContentEmoji", direction: "OneWay")
    image: File @relation(name: "ProjectImage", direction: "OneWay")
    Project: Project @relation(name: "ProjectContent")
    terminalInput: String @trim
    terminalOutput: String @trim
  }
`;

export default ProjectContent;

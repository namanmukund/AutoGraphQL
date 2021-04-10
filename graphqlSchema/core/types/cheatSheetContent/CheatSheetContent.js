import { READ } from '../../../../constants/graphqlOperations';
import { TLA, TMS, TWA } from '../../../../constants';
import { CMS_HEAD, NOT_CMS_HEAD } from '../../../../constants/roles';

const CheatSheetContent = `
  type CheatSheetContent @model
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
    order: Int!
    type: CheatSheetType!
    statement: String @trim
    image: File @relation(name: "CheatSheetImage", direction: "OneWay")
    emoji: [StickerEmoji] @relation(name: "CheatSheetContentEmoji", direction: "OneWay")
    cheatSheet: CheatSheet @relation(name: "CheatSheetContent")
    terminalInput: String @trim
    terminalOutput: String @trim
  }
`;

export default CheatSheetContent;

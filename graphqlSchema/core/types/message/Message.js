import { READ } from '../../../../constants/graphqlOperations';
import { TLA, TMS } from '../../../../constants';
import { CMS_HEAD, NOT_CMS_HEAD } from '../../../../constants/roles';

const Message = `
  type Message @model
  @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: "*" },
      { appName: "${TLA}" operations: ${READ} }], 
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
    type: MessageType!
    statement: String @trim
    sticker: StickerEmoji @relation(name: "MessageSticker", direction: "OneWay")
    emoji: [StickerEmoji] @relation(name: "MessageEmoji", direction: "OneWay")
    image: File @relation(name: "MessageImage", direction: "OneWay")
    learningObjective: LearningObjective @relation(name: "LearningObjectiveMessage")
    terminalInput: String @trim
    terminalOutput: String @trim
    alignment: MessageAlignmentType!
  }
`;

export default Message;

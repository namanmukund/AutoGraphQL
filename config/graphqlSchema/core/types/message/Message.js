import { TLA, TMS } from '../../../../../constants';
import { READ } from '../../../../../constants/graphqlOperations';

const Message = `
  type Message @model
  @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: "*" },
      { appName: "${TLA}" operations: ${READ} }], 
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

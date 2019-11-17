const Message = `
  type Message @model {
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

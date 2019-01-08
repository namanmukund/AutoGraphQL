const Message = `
  type Message @model {
    order: Int!
    type: MessageType!
    statement: String
    image: File @relation(name: "MessageImage", direction: "OneWay")
    alignment: MessageAlignmentType!
    createdAt: Date @readOnly
    updatedAt: Date @readOnly
  }
`;

export default Message;

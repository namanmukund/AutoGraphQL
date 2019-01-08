const Chat = `
  type Chat @model {
    order: Int!
    type: ChatType!
    statement: String
    image: File @relation(name: "ChatImage", direction: "OneWay")
    alignment: ChatAlignmentType!
    createdAt: Date @readOnly
    updatedAt: Date @readOnly
  }
`;

export default Chat;

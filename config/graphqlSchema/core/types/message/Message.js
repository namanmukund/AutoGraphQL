const Message = `
  type Message @model {
    order: Int!
    type: MessageType!
    statement: String @length(min: 6, max: 300)
    image: File @relation(name: "MessageImage", direction: "OneWay")
    learningObjective: LearningObjective @relation(name: "LearningObjectiveMessage")
    terminalInput: String @length(min: 6, max: 300)
    terminalOutput: String @length(min: 6, max: 300)
    alignment: MessageAlignmentType!
    createdAt: Date @readOnly
    updatedAt: Date @readOnly
  }
`;

export default Message;

const Message = `
  type Message @model {
    order: Int!
    type: MessageType!
    statement: String @trim
    image: File @relation(name: "MessageImage", direction: "OneWay")
    learningObjective: LearningObjective @relation(name: "LearningObjectiveMessage")
    terminalInput: String @trim
    terminalOutput: String @trim
    alignment: MessageAlignmentType!
  }
`;

export default Message;

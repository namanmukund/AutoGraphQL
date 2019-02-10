const Message = `
  type Message @model {
    order: Int!
    type: MessageType!
    statement: String @length(min: 6, max: 300) @trim
    image: File @relation(name: "MessageImage", direction: "OneWay")
    learningObjective: LearningObjective @relation(name: "LearningObjectiveMessage")
    terminalInput: String @length(min: 6, max: 300) @trim
    terminalOutput: String @length(min: 6, max: 300) @trim
    alignment: MessageAlignmentType!
  }
`;

export default Message;

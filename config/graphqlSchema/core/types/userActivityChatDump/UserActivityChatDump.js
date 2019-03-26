const TerminalTryMessageType = `
  type TerminalTryMessageType {
   terminalMessage: Message @relation(name: "TerminalMessageUserActivityChatDump", direction: "OneWay")
   terminalTryCount: Int
 }`;

const ChatShareType = `
  type ChatShareType {
   shareMedium: String
   shareCount: Int
 }`;

const UserActivityChatDump = `
  type UserActivityChatDump @model {
    user: User! @relation(name: "UserActivityChatDump", direction: "OneWay")
    isBookmarked: Boolean @defaultValue(value: "false")
    isShared: Boolean @defaultValue(value: "false")
    chatShares: [ChatShareType]
    bookmarkCount: Int
    currentMessage: Message @relation(name: "MessageUserActivityChatDump", direction: "OneWay")
    terminalTryMessage: [TerminalTryMessageType]
    chatAction: UserActionType
    learningObjective: LearningObjective! @relation(name: "LearningObjectiveUserActivityChatDump", direction: "OneWay")
    topic: Topic @relation(name: "TopicUserActivityChatDump", direction: "OneWay")
  }
`;

export default [UserActivityChatDump, TerminalTryMessageType, ChatShareType];

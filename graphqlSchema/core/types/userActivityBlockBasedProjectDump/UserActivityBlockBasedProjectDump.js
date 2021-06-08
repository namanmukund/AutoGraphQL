const UserActivityBlockBasedProjectDump = `
  type UserActivityBlockBasedProjectDump @model {
    user: User! @relation(name: "UserActivityBlockBasedProjectDump", direction: "OneWay")
    blockBasedProject: BlockBasedProject! @relation(name: "ProjectUserActivityBlockBasedProjectDump", direction: "OneWay")
    blockBasedProjectAction: UserActionType
    answerLink: String
    topic: Topic @relation(name: "TopicUserActivityBlockBasedProjectDump", direction: "OneWay")
  }
`;

export default [UserActivityBlockBasedProjectDump];

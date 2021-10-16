const UserActivityBlockBasedProjectDump = `
  type UserActivityBlockBasedProjectDump @model {
    user: User! @relation(name: "UserActivityBlockBasedProjectDump", direction: "OneWay")
    blockBasedProject: BlockBasedProject! @relation(name: "ProjectUserActivityBlockBasedProjectDump", direction: "OneWay")
    blockBasedProjectAction: UserActionType
    answerLink: String
    isHomework: Boolean @defaultValue(value: "false")
    topic: Topic @relation(name: "TopicUserActivityBlockBasedProjectDump", direction: "OneWay")
    course: Course @relation(name: "UserActivityBlockBasedProjectDumpCourse", direction: "OneWay")
  }
`;

export default [UserActivityBlockBasedProjectDump];

const UserBlockBasedProject = `
  type UserBlockBasedProject @model @databaseController(mode: "aggregation") {
    user: User! @relation(name: "UserBlockBasedProject", direction: "OneWay")
    status: UserTopicTypeStatus @defaultValue(value: "incomplete")
    blockBasedProject: BlockBasedProject! @relation(name: "ProjectUserBlockBasedProject", direction: "OneWay")
    answerLink: String
    savedBlocks: String
    topic: Topic! @relation(name: "TopicUserBlockBasedProject", direction: "OneWay")
    course: Course @relation(name: "UserBlockBasedProjectCourse", direction: "OneWay")
    startTime: Date
    endTime: Date
  }
`;

export default [UserBlockBasedProject];

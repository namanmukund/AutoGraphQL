const UserBlockBasedProject = `
  type UserBlockBasedProject @model {
    user: User! @relation(name: "UserBlockBasedProject", direction: "OneWay")
    status: UserTopicTypeStatus @defaultValue(value: "incomplete")
    blockBasedProject: BlockBasedProject! @relation(name: "ProjectUserBlockBasedProject", direction: "OneWay")
    answerLink: String
    savedBlocks: String
    topic: Topic! @relation(name: "TopicUserBlockBasedProject", direction: "OneWay")
    course: Course @relation(name: "UserBlockBasedProjectCourse", direction: "OneWay")
    activityStartTime: Date
    activityEndTime: Date
  }
`;

export default [UserBlockBasedProject];

const UserBlockBasedProject = `
  type UserBlockBasedProject @model {
    user: User! @relation(name: "UserBlockBasedProject", direction: "OneWay")
    blockBasedProjectStatus: UserTopicTypeStatus @defaultValue(value: "incomplete")
    blockBasedProject: BlockBasedProject! @relation(name: "ProjectUserBlockBasedProject", direction: "OneWay")
    answerLink: String
    topic: Topic! @relation(name: "TopicUserBlockBasedProject", direction: "OneWay")
    course: Course @relation(name: "UserBlockBasedProjectCourse", direction: "OneWay")
  }
`;

export default [UserBlockBasedProject];

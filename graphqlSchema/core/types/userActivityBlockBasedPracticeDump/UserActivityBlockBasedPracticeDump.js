const UserActivityBlockBasedPracticeDump = `
  type UserActivityBlockBasedPracticeDump @model {
    user: User! @relation(name: "UserActivityBlockBasedPracticeDump", direction: "OneWay")
    blockBasedPractice: BlockBasedProject! @relation(name: "PracticeUserActivityBlockBasedPracticeDump", direction: "OneWay")
    blockBasedPracticeAction: UserActionType
    answerLink: String
    isHomework: Boolean @defaultValue(value: "false")
    topic: Topic @relation(name: "TopicUserActivityBlockBasedPracticeDump", direction: "OneWay")
    course: Course @relation(name: "UserActivityBlockBasedPracticeDumpCourse", direction: "OneWay")
  }
`;

export default [UserActivityBlockBasedPracticeDump];

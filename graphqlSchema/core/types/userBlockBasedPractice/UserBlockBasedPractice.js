const UserBlockBasedPractice = `
  type UserBlockBasedPractice @model @databaseController(mode: "aggregation") {
    user: User! @relation(name: "UserBlockBasedPractice", direction: "OneWay")
    status: UserTopicTypeStatus @defaultValue(value: "incomplete")
    blockBasedPractice: BlockBasedProject! @relation(name: "PracticeUserBlockBasedPractice", direction: "OneWay")
    answerLink: String
    savedBlocks: String
    topic: Topic! @relation(name: "TopicUserBlockBasedPractice", direction: "OneWay")
    course: Course @relation(name: "UserBlockBasedPracticeCourse", direction: "OneWay")
    result: EvaluationResult @defaultValue(value: "pending")
    startTime: Date
    endTime: Date
  }
`;

export default [UserBlockBasedPractice];

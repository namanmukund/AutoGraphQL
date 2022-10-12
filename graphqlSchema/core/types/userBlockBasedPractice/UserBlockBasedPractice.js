const UserBlockBasedPractice = `
  type UserBlockBasedPractice @model {
    user: User! @relation(name: "UserBlockBasedPractice", direction: "OneWay")
    status: UserTopicTypeStatus @defaultValue(value: "incomplete")
    blockBasedPractice: BlockBasedProject! @relation(name: "PracticeUserBlockBasedPractice", direction: "OneWay")
    answerLink: String
    savedBlocks: String
    attachments: [File] @relation(name: "UserBlockBasedPracticeAttachment", direction: "OneWay")
    topic: Topic! @relation(name: "TopicUserBlockBasedPractice", direction: "OneWay")
    course: Course @relation(name: "UserBlockBasedPracticeCourse", direction: "OneWay")
    startTime: Date
    endTime: Date
    evaluation: Evaluation @relation(name: "UserBlockBasedPracticeEvaluation")
    evaluationStatus: TaskCompletionStatus @defaultValue(value: "incomplete")
  }
`;

export default [UserBlockBasedPractice];

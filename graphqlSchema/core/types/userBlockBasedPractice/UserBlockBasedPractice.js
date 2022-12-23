const GsuiteFile = `
   type GsuiteFile {
    fileId: String
    name: String
    url: String
    thumbnailUrl: String
    mimeType: String
    parentFolderIDs: [String]
    iconLink: String
    createdTime: String
   }
`;
const UserBlockBasedPractice = `
  type UserBlockBasedPractice @model {
    user: User! @relation(name: "UserBlockBasedPractice", direction: "OneWay")
    status: UserTopicTypeStatus @defaultValue(value: "incomplete")
    blockBasedPractice: BlockBasedProject! @relation(name: "PracticeUserBlockBasedPractice", direction: "OneWay")
    answerLink: String
    savedBlocks: String
    gsuiteFile: GsuiteFile
    gsuiteLastRevision: GsuiteFile
    isGsuiteFileVisited: Boolean
    authors: [User] @relation(name: "UserBlockBasedPracticeAuthor", direction: "OneWay")
    attachments: [File] @relation(name: "UserBlockBasedPracticeAttachment", direction: "OneWay")
    topic: Topic! @relation(name: "TopicUserBlockBasedPractice", direction: "OneWay")
    course: Course @relation(name: "UserBlockBasedPracticeCourse", direction: "OneWay")
    startTime: Date
    endTime: Date
    evaluation: Evaluation @relation(name: "UserBlockBasedPracticeEvaluation")
    evaluationStatus: TaskCompletionStatus @defaultValue(value: "incomplete")
  }
`;

export default [UserBlockBasedPractice, GsuiteFile];

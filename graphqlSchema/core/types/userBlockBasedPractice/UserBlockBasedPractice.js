const GsuitFile = `
   type GsuitFile {
    fileId: String
    name: String
    url: String
    thumbnailUrl: String
    mimeType: String
    parentsId: [String]
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
    gsuitFile: GsuitFile
    gsuitLastRevision: GsuitFile
    attachments: [File] @relation(name: "UserBlockBasedPracticeAttachment", direction: "OneWay")
    topic: Topic! @relation(name: "TopicUserBlockBasedPractice", direction: "OneWay")
    course: Course @relation(name: "UserBlockBasedPracticeCourse", direction: "OneWay")
    result: EvaluationResult @defaultValue(value: "pending")
    startTime: Date
    endTime: Date
  }
`;

export default [UserBlockBasedPractice, GsuitFile];

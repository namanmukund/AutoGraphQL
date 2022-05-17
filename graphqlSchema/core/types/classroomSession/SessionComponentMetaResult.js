const SessionComponentMetaResult = `
  type SessionComponentMetaResult {
    id: String
    topicId: ID
    classroomId: ID
    classroomTitle: String
    totalStudents: Int
    completedHomeworkMeta: Int
    completedQuizMeta: Int
    completedAssignmentMeta: Int
    completedPracticeMeta: Int
    completedPQMeta: Int @defaultValue(value: "0")
    isPQComponentExists: Boolean @defaultValue(value: "false")
    sessionStatus: SessionStatus @defaultValue(value: "allotted")
  }
`;

export default [SessionComponentMetaResult];

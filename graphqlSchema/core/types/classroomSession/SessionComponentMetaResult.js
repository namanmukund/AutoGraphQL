const CompletedAssignmentDetailsByUser = `
  type CompletedAssignmentDetailsByUser {
    userId: ID
    username: String
    isHomeworkSubmitted: Boolean @defaultValue(value: "false")
    isQuizSubmitted: Boolean @defaultValue(value: "false")
    isAssignmentSubmitted: Boolean @defaultValue(value: "false")
    isPracticeSubmitted: Boolean @defaultValue(value: "false")
  }
`;

const SessionComponentMetaResult = `
  type SessionComponentMetaResult {
    id: String
    topicId: ID
    classroomId: ID
    classroomTitle: String
    totalStudents: Int
    completedPQMeta: Int @defaultValue(value: "0")
    isPQComponentExists: Boolean @defaultValue(value: "false")
    sessionStatus: SessionStatus @defaultValue(value: "allotted")
    completedAssignmentDetailsByUser: [CompletedAssignmentDetailsByUser]
  }
`;

export default [SessionComponentMetaResult, CompletedAssignmentDetailsByUser];

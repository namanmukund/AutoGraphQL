const SessionComponentMetaResult = `
  type SessionComponentMetaResult {
    id: String!
    topicId: ID
    classroomId: ID
    classroomTitle: String
    totalStudents: Int
    completedHomeworkMeta: Int
    completedQuizMeta: Int
    completedAssignmentMeta: Int
    completedPracticeMeta: Int
    sessionStatus: SessionStatus! @defaultValue(value: "allotted")
  }
`;

export default [SessionComponentMetaResult];

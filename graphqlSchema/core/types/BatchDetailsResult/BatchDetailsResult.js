const BatchDetailsResult = `
  type BatchDetailsResult {
    batchCode: String
    topicTitle: String
    sessionStartTime: String
    startTime: Date
    endTime: Date
    classroomTitle: String
    batchId: ID
    sessionStartDate: Date
    sessionId: ID
    batchStudents: [BatchStudentResult]
  }
`;

export default [BatchDetailsResult];

const BatchDetailsResult = `
  type BatchDetailsResult {
    batchCode: String
    topicTitle: String
    topicId: ID
    courseId: ID
    sessionStartTime: String
    startTime: Date
    endTime: Date
    classroomTitle: String
    batchId: ID
    sessionStartDate: Date
    sessionId: ID
    sessionStatus: SessionStatus! @defaultValue(value: "allotted")
    batchStudents: [BatchStudentResult]
    schoolDetail: GetSchoolDetailsResult
  }
`;

export default [BatchDetailsResult];

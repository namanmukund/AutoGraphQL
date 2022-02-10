const ClassroomDetailResult = `
  type ClassroomDetailResult {
    id: String!
    classroomDetail: ClassroomDetails
    sessions: [ClassroomSessionResult]
    learingCount: Int
    testCount: Int
    revisionCount: Int
    assignmentCount: Int
    tools: [ArrayValue]
  }
`;

export default [
  ClassroomDetailResult,
];

const ClassroomCourse = `  
type ClassroomCourse {
  id: String!
  order: Int
  description: String
  thumbnail: String
  title: String
}`;

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
    classroomCourse: ClassroomCourse
    createdAt: Date
    batchThumbnail:String
  }
`;

export default [
  ClassroomDetailResult,
  ClassroomCourse,
];

const ClassroomCourse = `  
type ClassroomCourse {
  id: String!
  order: Int
  description: String
  thumbnail: String
  title: String
  tools: [ArrayValue]
  programming: [ArrayValue]
  theory: [ArrayValue]
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
    classroomCourse: ClassroomCourse
    createdAt: Date
    batchThumbnail:String
    customSessionLink: String
  }
`;

export default [
  ClassroomDetailResult,
  ClassroomCourse,
];

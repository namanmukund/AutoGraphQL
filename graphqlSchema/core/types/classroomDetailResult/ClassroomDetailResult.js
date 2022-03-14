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

const BatchClass = `
type BatchClass {
  grade: Grade
  section: Section
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

const BatchAndSchoolResult = `
  type BatchAndSchoolResult {
    batchId: ID
    schoolId: ID
    batchClasses: [BatchClass]
  }
`;

export default [
  ClassroomDetailResult,
  ClassroomCourse,
  BatchAndSchoolResult,
  BatchClass,
];

const ClassroomDetailResult = `
  type ClassroomDetailResult {
    id: ID
    code: String
    classroomTitle: String!
    totalStudents: Int
    averageAttendance: Int
    sessionProgress: Int
  }
`;

const BatchClass = `
type BatchClass {
  grade: Grade
  section: Section
}`;


const BatchAndSchoolResult = `
  type BatchAndSchoolResult {
    batchId: ID
    schoolId: ID
    batchClasses: [BatchClass]
  }
`;

export default [
  ClassroomDetailResult,
  BatchAndSchoolResult,
  BatchClass,
];

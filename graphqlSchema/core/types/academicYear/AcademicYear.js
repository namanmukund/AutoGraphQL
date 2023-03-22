const AcademicYear = `
  type AcademicYear @model {
    school: School! @relation(name: "AcademicYearSchool")
    startDate: Date
    endDate: Date
    students: [StudentProfile] @relation(name: "AcademicYearStudentProfile")
    batches: [Batch] @relation(name: "BatchAcademicYear")
  }
`;
export default [AcademicYear];

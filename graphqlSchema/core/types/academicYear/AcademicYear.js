const AcademicYear = `
  type AcademicYear @model {
    school: School! @relation(name: "AcademicYearSchool")
    startDate: Date
    endDate: Date
    classes: [SchoolClass] @relation(name: "AcademicYearSchoolClass")
    students: [StudentProfile] @relation(name: "AcademicYearStudentProfile")
    batches: [Batch] @relation(name: "BatchAcademicYear")
  }
`;
export default [AcademicYear];

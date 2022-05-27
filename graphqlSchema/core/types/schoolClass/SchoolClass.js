const SchoolClass = `
  type SchoolClass @model {
    school: School! @relation(name: "SchoolClassSchool", isSubset: true)
    grade: Grade! @groupBy
    section: Section @groupBy
    gradeDisplayName: String
    sectionDisplayName: String
    students: [StudentProfile] @relation(name: "SchoolClassStudentProfile")
  }
`;
export default [SchoolClass];

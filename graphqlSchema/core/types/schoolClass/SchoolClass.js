const SchoolClass = `
  type SchoolClass @model {
    school: School @relation(name: "SchoolClassSchool", isSubset: true)
    grade: Grade @groupBy
    section: Section @groupBy
    students: [StudentProfile] @relation(name: "SchoolClassStudentProfile")
  }
`;
export default [SchoolClass];

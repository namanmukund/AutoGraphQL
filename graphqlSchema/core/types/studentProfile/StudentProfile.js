const StudentProfile = `
  type StudentProfile @model {
    grade: Grade @groupBy
    section: String @groupBy
    branch: String
    batch: String
    rollNo: Int
    year: Int
    schoolName: String
    user: User! @relation(name: "StudentProfileUser")
    school: School @relation(name: "StudentProfileSchool")
    parents: [ParentProfile] @relation(name: "StudentProfileParentProfile")
}`;

export default [StudentProfile];

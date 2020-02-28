const StudentProfile = `
  type StudentProfile @model {
    grade: Grade @groupBy
    section: String @groupBy
    rollNo: Int
    year: Int
    user: User! @relation(name: "StudentProfileUser")
    school: School @relation(name: "StudentProfileSchool")
    parents: [ParentProfile] @relation(name: "StudentProfileParentProfile")
}`;

export default [StudentProfile];

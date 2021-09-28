const StudentProfile = `
  type StudentProfile @model {
    grade: Grade @groupBy
    section: Section @groupBy
    branch: String
    rollNo: String
    profileAvatarCode: StudentProfileAvatarCode
    year: Int
    schoolName: String
    user: User! @relation(name: "StudentProfileUser")
    school: School @relation(name: "StudentProfileSchool")
    schoolClass: SchoolClass @relation(name: "SchoolClassStudentProfile")
    parents: [ParentProfile] @relation(name: "StudentProfileParentProfile")
    batch: Batch @relation(name: "BatchStudentProfile")
    mentorMenteeSession: MentorMenteeSession @relation(name:"MentorMenteeSessionStudentProfile")
}`;

export default [StudentProfile];

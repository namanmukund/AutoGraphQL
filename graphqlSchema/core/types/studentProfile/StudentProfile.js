const previousSchoolClass = `
  type PreviousSchoolClass {
  batch: Batch @relation(name:"StudentProfilePreviousSchoolClassBatch", direction: "OneWay")
  grade: Grade
  section: Section
  rollNo: String
  school: School @relation(name:"StudentProfilePreviousSchoolClassSchool", direction: "OneWay")
 }`;

const StudentProfile = `
  type StudentProfile @model @databaseController(mode: "aggregation") {
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
    batches: [Batch] @relation(name: "BatchesStudentProfile")
    eventAttendances: [EventAttendance] @relation(name:"EventAttendanceStudentProfile")
    bookingAgent: User @relation(name: "BookingAgentStudentProfile", direction: "OneWay")
    mentor: MentorProfile @relation(name: "MentorStudentProfile")
    events: [Event] @relation(name:"EventStudentProfile")
    wonEvents: [EventWinner] @relation(name:"EventWinnerStudentProfile")
    previousSchoolClass: [PreviousSchoolClass]
}`;

export default [StudentProfile, previousSchoolClass];

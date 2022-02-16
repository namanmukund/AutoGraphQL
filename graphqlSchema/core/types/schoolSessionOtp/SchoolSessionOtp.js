const SchoolSessionOtp = `
  type SchoolSessionOtp {
    grade: Grade!
    section: Section!
    student: StudentProfile! @relation(name:"StudentProfileSchoolSessionOtp", direction: "OneWay")
    otp: Int!
  }`;

export default [SchoolSessionOtp];

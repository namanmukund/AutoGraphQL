const SchoolSessionOtp = `
  type SchoolSessionOtp @model {
    grade: Grade!
    section: Section!
    batchSession: BatchSession! @relation(name:"SchoolSessionOtpBatchSession", direction: "OneWay")
    otp: Int!
  }`;

export default [SchoolSessionOtp];

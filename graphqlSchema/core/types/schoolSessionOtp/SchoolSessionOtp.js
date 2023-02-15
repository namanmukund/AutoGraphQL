const SchoolSessionOtp = `
  type SchoolSessionOtp @model {
    grade: Grade
    section: Section
    batchSession: BatchSession! @relation(name:"SchoolSessionOtpBatchSession")
    otp: String!
    expiryDate: String
  }`;

export default [SchoolSessionOtp];

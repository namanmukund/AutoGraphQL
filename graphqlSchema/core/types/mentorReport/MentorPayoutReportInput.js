const MentorPayoutReportInput = `
  input MentorPayoutReportInput {
    userId: String
    allMentors: Boolean @defaultValue(value: "false")
  }`;

export default [MentorPayoutReportInput];

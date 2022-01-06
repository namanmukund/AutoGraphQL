const MentorPayoutReportData = `
  type MentorPayoutReportData {
    mentorName: String
    mentorMenteeSessionCount: Int
    batchSessions: Int
    b2b: Int
    b2b2c: Int
    trialSessions: Int
    paidSessions: Int
    conversionBonusoneToOne: Int
    conversionBonusoneToTwo: Int
    conversionBonusoneToThree: Int
    b2cEarnings: Int
    b2bEarnings: Int
    b2b2cEarnings: Int
    totalEarnings: Int
    inIndia: Int
    inUSA: Int
    oneToOne: Int
    oneToTwo: Int
    oneToThree: Int
  }
`;

const MentorPayoutReportOutput = `
  type MentorPayoutReportOutput {
    data: [MentorPayoutReportData]
  }`;

export default [MentorPayoutReportOutput, MentorPayoutReportData];

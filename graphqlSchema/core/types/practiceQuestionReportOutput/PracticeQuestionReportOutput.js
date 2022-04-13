const PracticeQuestionOverallReport = `
  type PracticeQuestionOverallReport {
    submittedPercentage: Float
    attemptedPercentage: Float
    unattemptedPercentage: Float
    firstTryPercentage: Float
    secondTryPercentage: Float
    thirdTryPercentage: Float
    avgTriesPerQuestion: Float
    avgTimePerQuestion: Int
  }`;

const StudentSubmissions = `
  type StudentSubmissions {
    userId: String
    updatedAt: Date
  }
`;

const PQIndividualQuestionReport = `
  type PQIndividualQuestionReport {
    questionId: String
    firstTryPercentage: Float
    secondTryPercentage: Float
    thirdTryPercentage: Float
    avgTries: Float
    submissionsCount: Int
    submissions: [StudentSubmissions]
  }
`;

const PracticeQuestionReportOutput = `
  type PracticeQuestionReportOutput {
    practiceQuestionOverallReport: PracticeQuestionOverallReport
    pqIndividualQuestionReport: [PQIndividualQuestionReport]
  }`;

export default [
  PracticeQuestionReportOutput,
  PracticeQuestionOverallReport,
  PQIndividualQuestionReport,
  StudentSubmissions,
];

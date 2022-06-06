const PracticeQuestionOverallReport = `
  type PracticeQuestionOverallReport {
    loId: String
    loTitle: String
    submittedPercentage: Float @clamp
    attemptedPercentage: Float @clamp
    unattemptedPercentage: Float @clamp
    firstTryPercentage: Float @clamp
    secondTryPercentage: Float @clamp
    thirdTryPercentage: Float @clamp
    avgTriesPerQuestion: Float
    avgTimePerQuestion: Int
    pqIndividualQuestionReport: [PQIndividualQuestionReport]
  }`;

const StudentSubmissions = `
  type StudentSubmissions {
    userId: String
    updatedAt: Date
    averageTries: Float
    quizScore: Int
  }
`;

const PQIndividualQuestionReport = `
  type PQIndividualQuestionReport {
    questionId: String
    firstTryPercentage: Float @clamp
    secondTryPercentage: Float @clamp
    thirdTryPercentage: Float @clamp
    avgTries: Float
    submissionsCount: Int
    submissions: [StudentSubmissions]
  }
`;

const PracticeQuestionReportOutput = `
  type PracticeQuestionReportOutput {
    practiceQuestionOverallReport: [PracticeQuestionOverallReport]
  }`;

export default [
  PracticeQuestionReportOutput,
  PracticeQuestionOverallReport,
  PQIndividualQuestionReport,
  StudentSubmissions,
];

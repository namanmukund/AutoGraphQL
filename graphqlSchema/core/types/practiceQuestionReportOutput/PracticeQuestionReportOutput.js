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

const PQIndividualQuestionReport = `
  type PQIndividualQuestionReport {
    questionId: String
    firstTryPercentage: Float
    secondTryPercentage: Float
    thirdTryPercentage: Float
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
];

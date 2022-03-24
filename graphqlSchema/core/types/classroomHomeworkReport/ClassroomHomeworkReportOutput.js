const OverallReportType = `
  type OverallReportType {
    submittedPercentage: Float
    attemptedPercentage: Float
    unattemptedPercentage: Float
  }`;

const PartialReportType = `
  type PartialReportType {
    submittedPercentage: Float
    attemptedPercentage: Float
    unattemptedPercentage: Float
    totalQuestions: Int
    averageScore: Float
    averageCorrect: Float
    averageIncorrect: Float
    averagePartiallyCorrect: Float
  }`;

const ClassroomHomeworkReportOutput = `
  type ClassroomHomeworkReportOutput {
    overall: OverallReportType
    quiz: PartialReportType
    coding: PartialReportType
    pq: PartialReportType
  }`;

export default [ClassroomHomeworkReportOutput, OverallReportType, PartialReportType];

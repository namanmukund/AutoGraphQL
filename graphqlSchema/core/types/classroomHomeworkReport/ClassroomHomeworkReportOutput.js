const OverallReportType = `
  type OverallReportType {
    submittedPercentage: Int
    attemptedPercentage: Int
    unattemptedPercentage: Int
  }`;

const PartialReportType = `
  type PartialReportType {
    submittedPercentage: Int
    attemptedPercentage: Int
    unattemptedPercentage: Int
    totalQuestions: Int
    averageScore: Int
    averageCorrect: Int
    averageIncorrect: Int
    averagePartiallyCorrect: Int
  }`;

const ClassroomHomeworkReportOutput = `
  type ClassroomHomeworkReportOutput {
    overall: OverallReportType
    quiz: PartialReportType
    coding: PartialReportType
    pq: PartialReportType
  }`;

export default [ClassroomHomeworkReportOutput, OverallReportType, PartialReportType];

const OverallReportType = `
  type OverallReportType {
    submittedPercentage: Float @clamp
    attemptedPercentage: Float @clamp
    unattemptedPercentage: Float @clamp
  }`;

const IndividualQuestionsScoreType = `
  type IndividualQuestionsScoreType {
    questionId: String
    percentageCorrect: Float @clamp
    percentageIncorrect: Float @clamp
    percentageUnattempted: Float @clamp
    submissionsCount: Int
    title: String
  }
`;

const PartialReportType = `
  type PartialReportType {
    submittedPercentage: Float @clamp
    attemptedPercentage: Float @clamp
    unattemptedPercentage: Float @clamp
    totalQuestions: Int
    averageScore: Float
    averageCorrect: Float
    averageIncorrect: Float
    averagePartiallyCorrect: Float
    questions: [IndividualQuestionsScoreType]
    learningObjectiveReport: [IndividualQuestionsScoreType]
    notEvaluatedCount: Int
    submissionsCount: Int
    submissions: [StudentSubmissions]
    blockBasedPracticeTitle: String
  }`;

const ClassroomHomeworkReportOutput = `
  type ClassroomHomeworkReportOutput {
    overall: OverallReportType
    quiz: PartialReportType
    coding: PartialReportType
    blockBasedPractice: [PartialReportType]
  }`;

export default [
  ClassroomHomeworkReportOutput,
  OverallReportType,
  PartialReportType,
  IndividualQuestionsScoreType,
];

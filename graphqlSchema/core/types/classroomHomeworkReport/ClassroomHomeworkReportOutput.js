const OverallReportType = `
  type OverallReportType {
    submittedPercentage: Float
    attemptedPercentage: Float
    unattemptedPercentage: Float
  }`;

const IndividualQuestionsScoreType = `
  type IndividualQuestionsScoreType {
    questionId: String
    percentageCorrect: Float
    percentageIncorrect: Float
    percentageUnattempted: Float
    submissionsCount: Int
    title: String
  }
`;

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

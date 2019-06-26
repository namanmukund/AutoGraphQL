const quizReportLearningObjective = `
  type QuizReportLearningObjective {
    totalQuestionCount: Int
    correctQuestionCount: Int
    inCorrectQuestionCount: Int
    unansweredQuestionCount: Int
    learningObjective: LearningObjective @relation(name: "UserQuizReportPageLO", direction: "OneWay")
 }`;

const quizReportType = `
  type QuizReportType {
    totalQuestionCount: Int
    correctQuestionCount: Int
    inCorrectQuestionCount: Int
    unansweredQuestionCount: Int
    masteryLevel: MasteryLevelsType
 }`;

const quizAnswersType = `
  type QuizAnswersType {
   question: QuestionBank @relation(name: "QuestionUserQuiz", direction: "OneWay")
   questionDisplayOrder: Int
   isAttempted: Boolean @defaultValue(value: false)
   isCorrect: Boolean
   userMcqAnswer: [McqAnswer]
   userFibInputAnswer: [FibInputAnswer]
   userFibBlockAnswer: [FibBlocksAnswer]
   userArrangeAnswer: [ArrangeAnswer]
   mcqOptions: [McqOption]
   fibBlocksOptions: [FibBlocksOption]
   fibInputOptions: [FibInputOption]
   arrangeOptions: [ArrangeOption]
   learningObjective: LearningObjective @relation(name: "LearningObjectiveUserQuiz", direction: "OneWay")
 }`;

const reportType = `
  type ReportType {
    quizAnswers: [QuizAnswersType]
    quizReport: QuizReportType
    learningObjectiveReport: [QuizReportLearningObjective]
    quizReportNumber: String
 }`;

const UserFirstAndLatestQuizReport = `
  type UserFirstAndLatestQuizReport {
    user: User! @relation(name: "UserQuizReport", direction: "OneWay")
    firstQuizReport: ReportType
    latestQuizReport: ReportType
    topic: Topic @relation(name: "TopicUserQuizReport", direction: "OneWay")
  }
`;

export default [UserFirstAndLatestQuizReport,
  quizReportType,
  quizReportLearningObjective,
  quizAnswersType, reportType];

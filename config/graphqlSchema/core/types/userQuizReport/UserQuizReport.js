const reportMcqAnswerType = `
  type ReportMcqAnswerType {
   statement: String
   isSelected: Boolean @defaultValue(value: "false")
 }`;

const reportFibInputAnswerType = `
  type ReportFibInputAnswerType {
   answer: String
   position: Int
 }`;

const reportFibBlockAnswerType = `
  type ReportFibBlockAnswerType {
   statement: String
   position: Int
 }`;

const reportArrangeAnswerType = `
  type ReportArrangeAnswerType {
   statement: String
   order: Int
 }`;

const quizReportType = `
  type QuizReportType {
   question: QuestionBank @relation(name: "QuestionUserQuizReport", direction: "OneWay")
   questionDisplayOrder: Int
   isAttempted: Boolean
   isCorrect: Boolean
   reportMcqAnswer: [ReportMcqAnswerType]
   reportFibInputAnswer: [ReportFibInputAnswerType]
   reportFibBlockAnswer: [ReportFibBlockAnswerType]
   reportArrangeAnswer: [ReportArrangeAnswerType]
   learningObjective: LearningObjective @relation(name: "LearningObjectiveUserQuizReport", direction: "OneWay")
 }`;

const quizStat = `
  type QuizStat {
    attemptedQuestionCount: Int
    correctQuestionCount: Int
    totalQuestionCount: Int
 }`;

const UserQuizReport = `
  type UserQuizReport @model {
    user: User! @relation(name: "UserQuizReport", direction: "OneWay")
    firstQuizReport: [QuizReportType]
    latestQuizReport: [QuizReportType]
    firstQuizStats: QuizStat
    latestQuizStats: QuizStat
    topic: Topic @relation(name: "TopicUserQuizReport", direction: "OneWay")
  }
`;

export default [UserQuizReport, quizReportType, reportMcqAnswerType,
  reportFibInputAnswerType, reportFibBlockAnswerType, reportArrangeAnswerType, quizStat];

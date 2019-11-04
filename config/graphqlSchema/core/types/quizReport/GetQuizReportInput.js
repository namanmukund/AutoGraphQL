const ArrangeOptionQuizReport = `
  input ArrangeOptionQuizReport {
   statement: String
   position: Int
 }`;

const FibBlocksOptionQuizReport = `
  input FibBlocksOptionQuizReport {
   statement: String
   position: Int
 }`;

const FibInputOptionQuizReport = `
  input FibInputOptionQuizReport {
   answer: String
   position: Int
 }`;

const McqOptionQuizReport = `
  input McqOptionQuizReport {
   statement: String
   isSelected: Boolean @defaultValue(value: "false")
 }`;

const QuizReportQuestionsType = `
  input QuizReportQuestionsType {
   questionConnectId: ID
   questionDisplayOrder: Int
   isAttempted: Boolean @defaultValue(value: "false")
   userMcqAnswer: [McqOptionQuizReport]
   userFibInputAnswer: [FibInputOptionQuizReport]
   userFibBlockAnswer: [FibBlocksOptionQuizReport]
   userArrangeAnswer: [ArrangeOptionQuizReport]
 }`;

const GetQuizReportInput = `
  input GetQuizReportInput {
    topicId: ID!
    quizQuestions: [QuizReportQuestionsType]
  }`;

export default [
  GetQuizReportInput, QuizReportQuestionsType,
  ArrangeOptionQuizReport, FibBlocksOptionQuizReport,
  FibInputOptionQuizReport, McqOptionQuizReport,
];

const mcqAnswerType = `
  type ReportMcqAnswerType {
   statement: String
   isSelected: Boolean @defaultValue(value: "false")
 }`;

const fibInputAnswerType = `
  type ReportFibInputAnswerType {
   answer: String
   position: Int
 }`;

const fibBlockAnswerType = `
  type ReportFibBlockAnswerType {
   statement: String
   position: Int
 }`;

const arrangeAnswerType = `
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
   mcqAnswer: [McqAnswerType]
   fibInputAnswer: [FibInputAnswerType]
   fibBlockAnswer: [FibBlockAnswerType]
   arrangeAnswer: [ArrangeAnswerType]
   learningObjective: LearningObjective @relation(name: "LearningObjectiveUserQuizReport", direction: "OneWay")
 }`;

const quizStat = `
  type QuizStat {
    attemptedQuestionCount: Int
    correctQuestionCount: Int
    totalQuestionCount: Int
 }`;

const userQuizReportNextComponentType = `
  type UserQuizReportNextComponentType {
   topic: Topic @relation(name: "UserQuizReportNextComponentTypeTopic", direction: "OneWay")
   nextComponentType: CurrentComponentType!
 }`;

const UserQuizReport = `
  type UserQuizReport @model {
    user: User! @relation(name: "UserQuizReport", direction: "OneWay")
    quizReport: [QuizReportType]
    quizStats: QuizStat
    quizStatus: UserComponentStatus @defaultValue(value: "incomplete")
    topic: Topic @relation(name: "TopicUserQuizReport", direction: "OneWay")
    nextComponent: UserQuizReportNextComponentType
  }
`;

export default [UserQuizReport, quizReportType, mcqAnswerType,
  fibInputAnswerType, fibBlockAnswerType, arrangeAnswerType, quizStat,
  userQuizReportNextComponentType];

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
 }`;

const UserQuizReport = `
  type UserQuizReport @model {
    user: User! @relation(name: "UserQuizReport", direction: "OneWay")
    quizReport: QuizReportType
    learningObjectiveReport: [QuizReportLearningObjective]
    topic: Topic @relation(name: "TopicUserQuizReport", direction: "OneWay")
  }
`;

export default [UserQuizReport, quizReportType, quizReportLearningObjective];

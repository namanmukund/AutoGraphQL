const quizReportLearningObjective = `
  type QuizReportLearningObjective {
    correctQuestionCount: Int
    inCorrectQuestionCount: Int
    unansweredQuestionCount: Int
    accuracy: Int
    learningObjective: LearningObjective @relation(name: "UserQuizReportPageLO", direction: "OneWay")
 }`;

const quizReportType = `
  type QuizReportType {
    totalQuestionCount: Int
    correctQuestionCount: Int
    inCorrectQuestionCount: Int
    unansweredQuestionCount: Int
    accuracy: Int
 }`;

const UserQuizReport = `
  type UserQuizReport {
    user: User! @relation(name: "UserQuizReport", direction: "OneWay")
    firstQuizReport: QuizReportType
    latestQuizReport: QuizReportType
    LOReport: [QuizReportLearningObjective]
    topic: Topic @relation(name: "TopicUserQuizReport", direction: "OneWay")
  }
`;

export default [UserQuizReport, quizReportType, quizReportLearningObjective];

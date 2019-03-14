const quizReportPageLearningObjective = `
  type QuizReportPageLearningObjective {
    correctQuestionCount: Int
    inCorrectQuestionCount: Int
    unansweredQuestionCount: Int
    accuracy: Int
    learningObjective: LearningObjective @relation(name: "UserQuizReportPageLO", direction: "OneWay")
 }`;

const quizReportPageType = `
  type QuizReportPageType {
    totalQuestionCount: Int
    correctQuestionCount: Int
    inCorrectQuestionCount: Int
    unansweredQuestionCount: Int
    accuracy: Int
 }`;

const UserQuizReportPage = `
  type UserQuizReportPage {
    user: User! @relation(name: "UserQuizReport", direction: "OneWay")
    firstQuizReport: QuizReportPageType
    latestQuizReport: QuizReportPageType
    LOReport: [QuizReportPageLearningObjective]
    topic: Topic @relation(name: "TopicUserQuizReport", direction: "OneWay")
  }
`;

export default [UserQuizReportPage, quizReportPageType, quizReportPageLearningObjective];

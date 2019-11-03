const UserFirstAndLatestQuizNextComponentType = `
  type UserFirstAndLatestQuizNextComponentType {
   topic: Topic @relation(name: "UserFirstAndLatestQuizNextComponentTypeTopic", direction: "OneWay")
   nextComponentType: CurrentTopicComponentType!
 }`;

const firstandLastQuizReportLearningObjective = `
  type FirstandLastQuizReportLearningObjective {
    totalQuestionCount: Int
    correctQuestionCount: Int
    inCorrectQuestionCount: Int
    unansweredQuestionCount: Int
    recommendationText: String
    masteryLevel: MasteryLevelsType
    learningObjective: LearningObjective @relation(name: "UserQuizReportPageLO", direction: "OneWay")
 }`;

const firstandLastQuizReportType = `
  type FirstandLastQuizReportType {
    totalQuestionCount: Int
    correctQuestionCount: Int
    inCorrectQuestionCount: Int
    unansweredQuestionCount: Int
    masteryLevel: MasteryLevelsType
 }`;

const firstandLastReportType = `
  type FirstandLastReportType {
    quizReportId: ID
    quizReport: FirstandLastQuizReportType
    learningObjectiveReport: [FirstandLastQuizReportLearningObjective]
 }`;

const UserFirstAndLatestQuizReport = `
  type UserFirstAndLatestQuizReport {
    user: User! @relation(name: "UserQuizReport", direction: "OneWay")
    firstQuizReport: FirstandLastReportType
    latestQuizReport: FirstandLastReportType
    topic: Topic @relation(name: "TopicUserQuizReport", direction: "OneWay")
    nextComponent: UserFirstAndLatestQuizNextComponentType
  }
`;

export default [UserFirstAndLatestQuizReport,
  firstandLastQuizReportType,
  firstandLastQuizReportLearningObjective,
  firstandLastReportType,
  UserFirstAndLatestQuizNextComponentType];

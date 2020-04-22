const GetQuizReportResult = `
  type GetQuizReportResult {
    user: User! @relation(name: "UserQuizReport", direction: "OneWay")
    firstQuizReport: FirstandLastReportType
    latestQuizReport: FirstandLastReportType
    topic: Topic @relation(name: "TopicUserQuizReport", direction: "OneWay")
    nextComponent: UserFirstAndLatestQuizNextComponentType
  }
`;

export default [GetQuizReportResult];

const UserPQReport = `
  type UserPQReport @model {
    learningObjective: LearningObjective @relation(name: "UserPQReport", direction: "OneWay")
    user: User! @relation(name: "UserLO", direction: "OneWay")
    firstTryQuestionCount: Int
    secondTryQuestionCount: Int
    laterTryQuestionCount: Int
    helpUsedCount: Int
    answerUsedCount: Int
  }
`;

export default UserPQReport;

const UserPracticeQuestionReport = `
  type UserPracticeQuestionReport @model {
    learningObjective: LearningObjective @relation(name: "UserPQReport", direction: "OneWay")
    user: User! @relation(name: "UserLearningObjective", direction: "OneWay")
    firstTryCount: Int
    secondTryCount: Int
    threeOrMoreTryCount: Int
    helpUsedCount: Int
    answerUsedCount: Int
  }
`;

export default UserPracticeQuestionReport;

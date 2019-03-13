const UserLO = `
  type UserLO @model {
    user: User! @relation(name: "UserLO", direction: "OneWay")
    topic: Topic @relation(name: "UserVideoTopic", direction: "OneWay")
    learningObjective: LearningObjective @relation(name: "UserVideoLearningObjective", direction: "OneWay")
  }
`;

export default UserLO;

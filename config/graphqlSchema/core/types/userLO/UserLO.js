const QuestionUserLOType = `
  type QuestionUserLOType {
   question: QuestionBank @relation(name: "QuestionUserLO", direction: "OneWay")
   isHintused: Boolean @defaultValue(value: "false")
   isAnswerUsed: Boolean @defaultValue(value: "false")
   attemptNumber: Int
   status: UserComponentStatus
 }`;

const UserLO = `
  type UserLO @model {
    user: User! @relation(name: "UserLO", direction: "OneWay")
    topic: Topic @relation(name: "UserVideoTopic", direction: "OneWay")
    learningObjective: LearningObjective @relation(name: "UserLOLearningObjective", direction: "OneWay")
    chatStatus: UserComponentStatus
    questions: [QuestionUserLOType]
    pqStatus: UserComponentStatus
  }
`;

export default [UserLO, QuestionUserLOType];

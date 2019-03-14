const PracticeQuestionUserLOType = `
  type PracticeQuestionUserLOType {
   question: QuestionBank @relation(name: "QuestionUserLO", direction: "OneWay")
   isHintused: Boolean @defaultValue(value: "false")
   isAnswerUsed: Boolean @defaultValue(value: "false")
   attemptNumber: Int
   status: UserComponentStatus @defaultValue(value: "incomplete")
 }`;

const UserLO = `
  type UserLO @model {
    user: User! @relation(name: "UserLO", direction: "OneWay")
    topic: Topic @relation(name: "UserLOTopic", direction: "OneWay")
    learningObjective: LearningObjective! @relation(name: "UserLOLearningObjective", direction: "OneWay")
    chatStatus: UserComponentStatus @defaultValue(value: "incomplete")
    practiceQuestions: [PracticeQuestionUserLOType]
    practiceQuestionStatus: UserComponentStatus @defaultValue(value: "incomplete")
  }
`;

export default [UserLO, PracticeQuestionUserLOType];

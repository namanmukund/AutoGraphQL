const practiceQuestionsUserLOType = `
  type PracticeQuestionsUserLOType {
   question: QuestionBank @relation(name: "QuestionUserLO", direction: "OneWay")
   isHintused: Boolean @defaultValue(value: "false")
   isAnswerUsed: Boolean @defaultValue(value: "false")
   attemptNumber: Int @defaultValue(value: 0)
   status: UserComponentStatus @defaultValue(value: "incomplete")
 }`;

const userLOnextComponentType = `
  type UserLONextComponentType {
   learningObjective: LearningObjective @relation(name: "UserLONextComponentTypeLO", direction: "OneWay")
   nextComponentType: CurrentComponentType
   topic: Topic @relation(name: "UserLONextComponentTypeTopic", direction: "OneWay")
 }`;

const UserLO = `
  type UserLO @model {
    user: User! @relation(name: "UserLO", direction: "OneWay")
    learningObjective: LearningObjective! @relation(name: "UserLOLearningObjective", direction: "OneWay")
    chatStatus: UserComponentStatus @defaultValue(value: "incomplete")
    isChatBookmarked: Boolean @defaultValue(value: "false")
    practiceQuestions: [PracticeQuestionsUserLOType]
    practiceQuestionStatus: UserComponentStatus @defaultValue(value: "incomplete")
    isPracticeQuestionBookmarked: Boolean @defaultValue(value: "false")
    nextComponent: UserLONextComponentType
  }
`;

export default [UserLO, practiceQuestionsUserLOType, userLOnextComponentType];

const practiceQuestionsUserLearningObjectiveType = `
  type PracticeQuestionsUserLearningObjectiveType {
   question: QuestionBank @relation(name: "QuestionUserLearningObjective", direction: "OneWay")
   isHintUsed: Boolean @defaultValue(value: "false")
   isAnswerUsed: Boolean @defaultValue(value: "false")
   attemptNumber: Int @defaultValue(value: 0)
   status: UserTopicTypeStatus @defaultValue(value: "incomplete")
 }`;

const userLearningObjectivenextComponentType = `
  type UserLearningObjectiveNextComponentType {
   learningObjective: LearningObjective @relation(name: "UserLearningObjectiveNextComponentTypeLO", direction: "OneWay")
   nextComponentType: CurrentTopicComponentType
   topic: Topic @relation(name: "UserLearningObjectiveNextComponentTypeTopic", direction: "OneWay")
 }`;

const UserLearningObjective = `
  type UserLearningObjective @model {
    user: User! @relation(name: "UserLearningObjective", direction: "OneWay")
    learningObjective: LearningObjective! @relation(name: "UserLearningObjectiveLearningObjective", direction: "OneWay")
    chatStatus: UserTopicTypeStatus @defaultValue(value: "incomplete")
    isChatBookmarked: Boolean @defaultValue(value: "false")
    practiceQuestions: [PracticeQuestionsUserLearningObjectiveType]
    practiceQuestionStatus: UserTopicTypeStatus @defaultValue(value: "incomplete")
    isPracticeQuestionBookmarked: Boolean @defaultValue(value: "false")
    comicStripStatus: UserTopicTypeStatus @defaultValue(value: "incomplete")
    isComicStripBookmarked: Boolean @defaultValue(value: "false")
    nextComponent: UserLearningObjectiveNextComponentType
  }
`;

export default [UserLearningObjective, practiceQuestionsUserLearningObjectiveType,
  userLearningObjectivenextComponentType];

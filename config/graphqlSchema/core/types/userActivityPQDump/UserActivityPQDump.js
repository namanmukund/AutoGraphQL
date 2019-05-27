const practiceQuestionsType = `
  type PracticeQuestionsType {
   question: QuestionBank @relation(name: "QuestionUserActivityPQDump", direction: "OneWay")
   questionAction: UserActionType
   questionDisplayOrder: Int
   isCorrect: Boolean
   isHintUsed: Boolean @defaultValue(value: "false")
   isAnswerUsed: Boolean @defaultValue(value: "false")
   isRecommendationUsed: Boolean @defaultValue(value: "false")
   attemptNumber: Int
   userMcqAnswer: [McqAnswer]
   userFibInputAnswer: [FibInputAnswer]
   userFibBlockAnswer: [FibBlocksAnswer]
   userArrangeAnswer: [ArrangeAnswer]
 }`;

const PQShareType = `
  type PQShareType {
   shareMedium: String
   shareCount: Int
 }`;

const UserActivityPQDump = `
  type UserActivityPQDump @model {
    user: User! @relation(name: "UserActivityPQDump", direction: "OneWay")
    isBookmarked: Boolean
    isShared: Boolean
    pqShare: [PQShareType]
    bookmarkCount: Int
    practiceQuestionsDump: [PracticeQuestionsType]
    pqAction: UserActionType
    learningObjective: LearningObjective! @relation(name: "LearningObjectiveUserActivityPQDump", direction: "OneWay")
    topic: Topic @relation(name: "TopicUserActivityPQDump", direction: "OneWay")
  }
`;

export default [UserActivityPQDump, practiceQuestionsType, PQShareType];

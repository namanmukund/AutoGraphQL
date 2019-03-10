const pqMcqOptionType = `
  type PQMCQOptionType {
   statement: String
   isSelected: Boolean @defaultValue(value: "false")
 }`;

const pqBlankType = `
  type PQBlankType {
   answer: String
 }`;

const pqBlockType = `
  type PQBlockType {
   statement: String
 }`;

const pqArrangeType = `
  type PQArrangeType {
   statement: String
 }`;

const pqMcqAnswer = `
  type PQMcqAnswerType {
   isHintused: Boolean @defaultValue(value: "false")
   isAnswerUsed: Boolean @defaultValue(value: "false")
   isRecommendationUsed: Boolean @defaultValue(value: "false")
   attemptNumber: Int
   option1: PQMCQOptionType
   option2: PQMCQOptionType
   option3: PQMCQOptionType
   option4: PQMCQOptionType
   option5: PQMCQOptionType
   option6: PQMCQOptionType
 }`;

const pqFibInputAnswer = `
  type PQFibInputAnswerType {
   isHintused: Boolean @defaultValue(value: "false")
   isAnswerUsed: Boolean @defaultValue(value: "false")
   isRecommendationUsed: Boolean @defaultValue(value: "false")
   attemptNumber: Int
   blank1: PQBlankType
   blank2: PQBlankType
   blank3: PQBlankType
   blank4: PQBlankType
   blank5: PQBlankType
   blank6: PQBlankType
   blank7: PQBlankType
   blank8: PQBlankType
   blank9: PQBlankType
 }`;

const pqFibBlockAnswer = `
  type PQFibBlockAnswerType {
   isHintused: Boolean @defaultValue(value: "false")
   isAnswerUsed: Boolean @defaultValue(value: "false")
   isRecommendationUsed: Boolean @defaultValue(value: "false")
   attemptNumber: Int
   block1: PQBlockType
   block2: PQBlockType
   block3: PQBlockType
   block4: PQBlockType
   block5: PQBlockType
   block6: PQBlockType
   block7: PQBlockType
   block8: PQBlockType
   block9: PQBlockType
 }`;

const pqArrangeAnswer = `
  type PQArrangeAnswerType {
   isHintused: Boolean @defaultValue(value: "false")
   isAnswerUsed: Boolean @defaultValue(value: "false")
   isRecommendationUsed: Boolean @defaultValue(value: "false")
   attemptNumber: Int
   arrange1: PQArrangeType
   arrange1: PQArrangeType
   arrange1: PQArrangeType
   arrange1: PQArrangeType
   arrange1: PQArrangeType
   arrange1: PQArrangeType
   arrange1: PQArrangeType
   arrange1: PQArrangeType
 }`;

const practiceQuestionsType = `
  type PracticeQuestionsType {
   question: QuestionBank @relation(name: "QuestionUserActivityPQDump", direction: "OneWay")
   questionAction: AssetActionType
   questionDisplayOrder: Int
   mcqAnswer: [PQMcqAnswerType]
   fibInputAnswer: [PQFibInputAnswerType]
   fibBlockAnswer: [PQFibBlockAnswerType]
   arrangeAnswer: [PQArrangeAnswerType]
 }`;

const PQShareType = `
  type PQShareType {
   shareMedium: String
   shareCount: Int
 }`;

const UserActivityPQDump = `
  type UserActivityPQDump @model {
    user: User @relation(name: "UserActivityPQDump", direction: "OneWay")
    isBookmarked: Boolean @defaultValue(value: "false")
    isShared: Boolean @defaultValue(value: "false")
    pqShare: [PQShareType]
    bookmarkCount: Int
    practiceQuestions: [PracticeQuestionsType]
    pqAction: AssetActionType
    learningObjective: LearningObjective @relation(name: "LearningObjectiveUserActivityPQDump", direction: "OneWay")
    topic: Topic @relation(name: "TopicUserActivityPQDump", direction: "OneWay")
  }
`;

export default [UserActivityPQDump, practiceQuestionsType, PQShareType, pqMcqAnswer,
  pqFibInputAnswer, pqFibBlockAnswer, pqArrangeAnswer, pqMcqOptionType, pqBlankType, pqBlockType,
  pqArrangeType];

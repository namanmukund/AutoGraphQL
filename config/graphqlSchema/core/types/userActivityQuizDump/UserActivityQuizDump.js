const optionType = `
  type OptionType {
   statement: String
   isSelected: Boolean @defaultValue(value: "false")
 }`;

const blankType = `
  type BlankType {
   answer: String
 }`;

const blockType = `
  type BlockType {
   statement: String
 }`;

const arrangeType = `
  type ArrangeType {
   statement: String
 }`;

const mcqAnswer = `
  type McqAnswerType {
   isCorrect: Boolean @defaultValue(value: "false")
   isAttempted: Boolean @defaultValue(value: "false")
   attemptNumber: Int
   option1: OptionType
   option2: OptionType
   option3: OptionType
   option4: OptionType
   option5: OptionType
   option6: OptionType
 }`;

const fibInputAnswer = `
  type FibInputAnswerType {
   isCorrect: Boolean @defaultValue(value: "false")
   isAttempted: Boolean @defaultValue(value: "false")
   attemptNumber: Int
   blank1: BlankType
   blank2: BlankType
   blank3: BlankType
   blank4: BlankType
   blank5: BlankType
   blank6: BlankType
   blank7: BlankType
   blank8: BlankType
   blank9: BlankType
 }`;

const fibBlockAnswer = `
  type FibBlockAnswerType {
   isCorrect: Boolean @defaultValue(value: "false")
   isAttempted: Boolean @defaultValue(value: "false")
   attemptNumber: Int
   block1: BlockType
   block2: BlockType
   block3: BlockType
   block4: BlockType
   block5: BlockType
   block6: BlockType
   block7: BlockType
   block8: BlockType
   block9: BlockType
 }`;

const arrangeAnswer = `
  type ArrangeAnswerType {
   isCorrect: Boolean @defaultValue(value: "false")
   isAttempted: Boolean @defaultValue(value: "false")
   attemptNumber: Int
   arrange1: ArrangeType
   arrange1: ArrangeType
   arrange1: ArrangeType
   arrange1: ArrangeType
   arrange1: ArrangeType
   arrange1: ArrangeType
   arrange1: ArrangeType
   arrange1: ArrangeType
 }`;

const quizQuestionsType = `
  type QuizQuestionsType {
   question: QuestionBank @relation(name: "QuestionUserActivityQuizDump", direction: "OneWay")
   questionAction: AssetActionType
   questionDisplayOrder: Int
   mcqAnswer: [McqAnswerType]
   fibInputAnswer: [FibInputAnswerType]
   fibBlockAnswer: [FibBlockAnswerType]
   arrangeAnswer: [ArrangeAnswerType]
 }`;

const UserActivityQuizDump = `
  type UserActivityQuizDump @model {
    user: User @relation(name: "UserActivityQuizDump", direction: "OneWay")
    quizQuestions: [QuizQuestionsType]
    quizAction: AssetActionType
    topic: Topic @relation(name: "TopicUserActivityQuizDump", direction: "OneWay")
  }
`;

export default [UserActivityQuizDump, quizQuestionsType, mcqAnswer,
  fibInputAnswer, fibBlockAnswer, arrangeAnswer, optionType, blankType, blockType,
  arrangeType];

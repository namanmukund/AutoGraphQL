const mcqAnswer = `
  type McqAnswerType {
   statement: String
   isSelected: Boolean @defaultValue(value: "false")
 }`;

const fibInputAnswer = `
  type FibInputAnswerType {
   answer: String
   position: Int
 }`;

const fibBlockAnswer = `
  type FibBlockAnswerType {
   statement: String
   position: Int
 }`;

const arrangeAnswer = `
  type ArrangeAnswerType {
   statement: String
   position: Int
 }`;

const quizQuestionsType = `
  type QuizQuestionsType {
   question: QuestionBank @relation(name: "QuestionUserActivityQuizDump", direction: "OneWay")
   questionDisplayOrder: Int
   isAttempted: Boolean @defaultValue(value: "false")
   userMcqAnswer: [McqAnswerType]
   userFibInputAnswer: [FibInputAnswerType]
   userFibBlockAnswer: [FibBlockAnswerType]
   userArrangeAnswer: [ArrangeAnswerType]
 }`;

const UserActivityQuizDump = `
  type UserActivityQuizDump @model {
    user: User! @relation(name: "UserActivityQuizDump", direction: "OneWay")
    quizQuestions: [QuizQuestionsType]
    quizAction: UserActionType
    topic: Topic @relation(name: "TopicUserActivityQuizDump", direction: "OneWay")
  }
`;

export default [UserActivityQuizDump, quizQuestionsType, mcqAnswer,
  fibInputAnswer, fibBlockAnswer, arrangeAnswer];

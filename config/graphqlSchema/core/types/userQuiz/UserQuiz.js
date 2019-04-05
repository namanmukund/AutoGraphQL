const quizMcqAnswerType = `
  type QuizMcqAnswerType {
   statement: String
   isSelected: Boolean @defaultValue(value: "false")
 }`;

const quizFibInputAnswerType = `
  type QuizFibInputAnswerType {
   answer: String
   position: Int
 }`;

const quizFibBlockAnswerType = `
  type QuizFibBlockAnswerType {
   statement: String
   position: Int
 }`;

const quizArrangeAnswerType = `
  type QuizArrangeAnswerType {
   statement: String
   order: Int
 }`;

const quizType = `
  type QuizType {
   question: QuestionBank @relation(name: "QuestionUserQuiz", direction: "OneWay")
   questionDisplayOrder: Int
   isAttempted: Boolean @defaultValue(value: false)
   isCorrect: Boolean
   userMcqAnswer: [QuizMcqAnswerType]
   userFibInputAnswer: [QuizFibInputAnswerType]
   userFibBlockAnswer: [QuizFibBlockAnswerType]
   userArrangeAnswer: [QuizArrangeAnswerType]
   mcqOptions: [McqOption]
   fibBlocksOptions: [FibBlocksOption]
   fibInputOptions: [FibInputOption]
   arrangeOptions: [ArrangeOption]
   learningObjective: LearningObjective @relation(name: "LearningObjectiveUserQuiz", direction: "OneWay")
 }`;

const userQuizNextComponentType = `
  type UserQuizNextComponentType {
   topic: Topic @relation(name: "UserQuizNextComponentTypeTopic", direction: "OneWay")
   nextComponentType: CurrentTopicComponentType!
 }`;

const UserQuiz = `
  type UserQuiz @model {
    user: User! @relation(name: "UserQuiz", direction: "OneWay")
    quiz: [QuizType]
    quizStatus: UserTopicTypeStatus @defaultValue(value: "incomplete")
    topic: Topic! @relation(name: "TopicUserQuiz", direction: "OneWay")
    nextComponent: UserQuizNextComponentType
  }
`;

export default [UserQuiz, quizType, quizMcqAnswerType,
  quizFibInputAnswerType, quizFibBlockAnswerType, quizArrangeAnswerType,
  userQuizNextComponentType];

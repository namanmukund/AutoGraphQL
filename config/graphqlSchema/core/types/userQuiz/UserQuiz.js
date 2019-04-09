const quizType = `
  type QuizType {
   question: QuestionBank @relation(name: "QuestionUserQuiz", direction: "OneWay")
   questionDisplayOrder: Int
   isAttempted: Boolean @defaultValue(value: false)
   isCorrect: Boolean
   userMcqAnswer: [McqAnswer]
   userFibInputAnswer: [FibInputAnswer]
   userFibBlockAnswer: [FibBlocksAnswer]
   userArrangeAnswer: [ArrangeAnswer]
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

export default [UserQuiz, quizType, userQuizNextComponentType];

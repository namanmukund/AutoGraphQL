const quizQuestionsType = `
  type QuizQuestionsType {
   question: QuestionBank @relation(name: "QuestionUserActivityQuizDump", direction: "OneWay")
   questionDisplayOrder: Int
   isAttempted: Boolean @defaultValue(value: "false")
   userMcqAnswer: [McqAnswer]
   userFibInputAnswer: [FibInputAnswer]
   userFibBlockAnswer: [FibBlocksAnswer]
   userArrangeAnswer: [ArrangeAnswer]
 }`;

const UserActivityQuizDump = `
  type UserActivityQuizDump @model {
    user: User! @relation(name: "UserActivityQuizDump", direction: "OneWay")
    quizQuestions: [QuizQuestionsType]
    quizAction: UserActionType
    quizReportId: ID
    topic: Topic @relation(name: "TopicUserActivityQuizDump", direction: "OneWay")
    course: Course @relation(name: "UserActivityQuizDumpCourse", direction: "OneWay")
  }
`;

export default [UserActivityQuizDump, quizQuestionsType];

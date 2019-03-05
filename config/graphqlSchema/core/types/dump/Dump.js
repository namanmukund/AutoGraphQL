const type = `
  enum DumpType {
    practiceQuestion
    quiz
    chat
    video
  }`;

const mcqAnswer = `
  type McqAnswerType {
   statement: String
 }`;

const fibInputAnswer = `
  type FibInputAnswerType {
   position: Int
   answer: String
   topic: [Topic] @relation(name: "QuestionsssDump", direction: "OneWay")
 }`;

const fibBlocksAnswer = `
  type FibBlocksAnswerType {
   statement: String
   position: Int
 }`;

const arrangeAnswer = `
  type ArrangeAnswerType {
   order: Int
   statement: String
 }`;

const pqAttemptedQuestion = `
  type PQAttemptedQuestion {
   question: QuestionBank @relation(name: "QuestionDump")
   abcd: LearningObjective @relation(name: "LosdsdsDump", direction: "OneWay")
   attemptCount: Int
   isHintUsed: Boolean @defaultValue(value: "false")
   isAnswerUsed: Boolean @defaultValue(value: "false")
 }`;

const quizAttemptedQuestion = `
  type QuizAttemptedQuestion {
   question: QuestionBank @relation(name: "QuestionDump", direction: "OneWay")
   isCorrect: Boolean
   isAttempted: Boolean @defaultValue(value: "false")
   mcqAnswer: [McqAnswerType]
   fibInputAnswer: [FibInputAnswerType]
   fibBlocksAnswer: [FibBlocksAnswerType]
   arrangeAnswer: [ArrangeAnswerType]
   defg: LearningObjective @relation(name: "SksdjsbdJd", direction: "OneWay")

 }`;

const UserActivityDump = `
  type UserActivityDump @model {
    type: DumpType!
    user: User @relation(name: "UserDump", direction: "OneWay")
    topic: Topic @relation(name: "TopicDump", direction: "OneWay")
    learningObjective: LearningObjective @relation(name: "LearningObjectiveDump")
    pqAttemptedQuestions: PQAttemptedQuestion
    quizAttemptedQuestions: [QuizAttemptedQuestion]
    currentMessage: Message @relation(name: "MessageDump", direction: "OneWay")
    currentVideoTime: Int
  }
`;

export default [type, mcqAnswer, fibInputAnswer, fibBlocksAnswer,
  arrangeAnswer, pqAttemptedQuestion, quizAttemptedQuestion, UserActivityDump];

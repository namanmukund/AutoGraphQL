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
   question: [QuestionBank] @relation(name: "pqUserActivity")
   chapterInPQ: Chapter @relation(name: "chapteruserActivity")
   loInPQ: LearningObjective @relation(name: "PQLo", direction: "OneWay")
   topicPQ: [Topic] @relation(name: "TopicInPQAttemptedQues", direction: "OneWay")
   attemptCount: Int
   isHintUsed: Boolean @defaultValue(value: "false")
   isAnswerUsed: Boolean @defaultValue(value: "false")
 }`;

const testNoFieldsInParallel1to1 = `
  type TestNoFieldsInParallel1to1 {
   testNoFieldsInParallel1to1: LearningObjective @relation(name: "RTestNoFieldsInParallel1to1", direction: "OneWay")
 }`;

const testNoFieldsInParallel1tom = `
  type TestNoFieldsInParallel1tom {
   testNoFieldsInParallel1tom: [LearningObjective] @relation(name: "RTestNoFieldsInParallel1tom", direction: "OneWay")
 }`;

const TestNoFieldsInParalleltwo1to1 = `
  type TestNoFieldsInParalleltwo1to1 {
   testNoFieldsInParalleltwo1to1: LearningObjective @relation(name: "RTestNoFieldsInParalleltwo1to1")
 }`;

const testNoFieldsInParalleltwo1tom = `
  type TestNoFieldsInParalleltwo1tom {
   testNoFieldsInParalleltwo1tom: [LearningObjective] @relation(name: "RTestNoFieldsInParalleltwo1tom")
 }`;

const quizAttemptedQuestion = `
  type QuizAttemptedQuestion {
   question: QuestionBank @relation(name: "AbcdEfg")
   loQuiz: [LearningObjective] @relation(name: "QuizLo")
   thumbnail: File @relation(name: "QuizThumbnail", direction: "OneWay")
   topicQuiz: [Topic] @relation(name: "TopicInQuizAttemptedQues", direction: "OneWay")
   chapter: Chapter @relation(name: "dffdfs", direction: "OneWay")
   isCorrect: Boolean
   isAttempted: Boolean @defaultValue(value: "false")
   mcqAnswer: [McqAnswerType]
   fibInputAnswer: [FibInputAnswerType]
   fibBlocksAnswer: [FibBlocksAnswerType]
   arrangeAnswer: [ArrangeAnswerType]
 }`;

const testNoFieldsInParallel1to1A = `
  type TestNoFieldsInParallel1to1A {
   testNoFieldsInParallel1to1A: LearningObjective @relation(name: "RTestNoFieldsInParallel1to1A", direction: "OneWay")
 }`;

const testNoFieldsInParallel1tomA = `
  type TestNoFieldsInParallel1tomA {
   testNoFieldsInParallel1tomA: [LearningObjective] @relation(name: "RTestNoFieldsInParallel1tomA", direction: "OneWay")
 }`;

const TestNoFieldsInParalleltwo1to1A = `
  type TestNoFieldsInParalleltwo1to1A {
   testNoFieldsInParalleltwo1to1A: LearningObjective @relation(name: "RTestNoFieldsInParalleltwo1to1A")
 }`;

const testNoFieldsInParalleltwo1tomA = `
  type TestNoFieldsInParalleltwo1tomA {
   testNoFieldsInParalleltwo1tomA: [LearningObjective] @relation(name: "RTestNoFieldsInParalleltwo1tomA")
 }`;

const UserActivityDump = `
  type UserActivityDump @model {
    type: DumpType!
    user: User @relation(name: "UserDump", direction: "OneWay")
    topic: Topic @relation(name: "TopicDump", direction: "OneWay")
    learningObjective: LearningObjective @relation(name: "LearningObjectiveDump", direction: "OneWay")
    pqAttemptedQuestions: PQAttemptedQuestion
    testNoFieldsInParallel1to1: TestNoFieldsInParallel1to1
    testNoFieldsInParallel1tom: TestNoFieldsInParallel1tom
    testNoFieldsInParalleltwo1to1: TestNoFieldsInParalleltwo1to1
    testNoFieldsInParalleltwo1tom: TestNoFieldsInParalleltwo1tom
    quizAttemptedQuestions: [QuizAttemptedQuestion]
    estNoFieldsInParallel1to1A: [TestNoFieldsInParallel1to1A]
    testNoFieldsInParallel1tomA: [TestNoFieldsInParallel1tomA]
    testNoFieldsInParalleltwo1to1A: [TestNoFieldsInParalleltwo1to1A]
    testNoFieldsInParalleltwo1tomA: [TestNoFieldsInParalleltwo1tomA]
    currentMessage: Message @relation(name: "MessageDump", direction: "OneWay")
    currentVideoTime: Int
  }
`;

export default [type, mcqAnswer, fibInputAnswer, fibBlocksAnswer,
  arrangeAnswer, pqAttemptedQuestion, quizAttemptedQuestion,
  UserActivityDump, testNoFieldsInParallel1to1, testNoFieldsInParallel1tom,
  TestNoFieldsInParalleltwo1to1, testNoFieldsInParalleltwo1tom, testNoFieldsInParallel1to1A,
  testNoFieldsInParallel1tomA, TestNoFieldsInParalleltwo1to1A, testNoFieldsInParalleltwo1tomA];

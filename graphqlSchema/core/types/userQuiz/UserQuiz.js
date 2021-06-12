const userQuizNextComponentType = `
  type UserQuizNextComponentType {
   topic: Topic @relation(name: "UserQuizNextComponentTypeTopic", direction: "OneWay")
   nextComponentType: CurrentTopicComponentType!
 }`;

const quizType = `
  type QuizType {
   question: QuestionBank @relation(name: "QuestionUserLearningObjective", direction: "OneWay")
   questionDisplayOrder: Int
 }`;

const UserQuiz = `
  type UserQuiz @model {
    user: User! @relation(name: "UserQuiz", direction: "OneWay")
    quizStatus: UserTopicTypeStatus @defaultValue(value: "incomplete")
    quiz: [QuizType]
    topic: Topic! @relation(name: "TopicUserQuiz", direction: "OneWay")
    nextComponent: UserQuizNextComponentType
    course: Course @relation(name: "UserQuizCourse", direction: "OneWay")
  }
`;

export default [UserQuiz, userQuizNextComponentType, quizType];

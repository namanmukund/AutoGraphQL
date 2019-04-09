const userQuizNextComponentType = `
  type UserQuizNextComponentType {
   topic: Topic @relation(name: "UserQuizNextComponentTypeTopic", direction: "OneWay")
   nextComponentType: CurrentTopicComponentType!
 }`;

const UserQuiz = `
  type UserQuiz @model {
    user: User! @relation(name: "UserQuiz", direction: "OneWay")
    quizStatus: UserTopicTypeStatus @defaultValue(value: "incomplete")
    topic: Topic! @relation(name: "TopicUserQuiz", direction: "OneWay")
    nextComponent: UserQuizNextComponentType
  }
`;

export default [UserQuiz, userQuizNextComponentType];

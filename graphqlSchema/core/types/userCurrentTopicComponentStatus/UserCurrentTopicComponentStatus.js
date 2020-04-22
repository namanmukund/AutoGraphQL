const UserCurrentTopicComponentStatus = `
  type UserCurrentTopicComponentStatus @model {
    user: User! @relation(name: "UserCurrentTopicComponentStatus", direction: "OneWay")
    currentCourse: Course! @relation(name: "UserCurrentTopicComponentStatusCourse", direction: "OneWay")
    enrollmentType: EnrollmentType! @defaultValue(value: "free")
    currentTopic: Topic! @relation(name: "UserCurrentTopicComponentStatusTopic", direction: "OneWay")
    currentLearningObjective: LearningObjective @relation(name: "UserCurrentTopicComponentStatusLearningObjective", direction: "OneWay")
    currentPracticeQuestion: QuestionBank @relation(name: "UserCurrentTopicComponentStatusQuestionBank", direction: "OneWay")
    currentTopicComponentType: CurrentTopicComponentType!
  }
`;

export default UserCurrentTopicComponentStatus;

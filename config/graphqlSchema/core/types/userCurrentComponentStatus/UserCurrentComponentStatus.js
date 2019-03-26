const UserCurrentComponentStatus = `
  type UserCurrentComponentStatus @model {
    user: User! @relation(name: "UserCurrentComponentStatus", direction: "OneWay")
    currentCourse: Course! @relation(name: "UserCurrentComponentStatusCourse", direction: "OneWay")
    enrollmentType: EnrollmentType! @defaultValue(value: "free")
    currentTopic: Topic! @relation(name: "UserCurrentComponentStatusTopic", direction: "OneWay")
    currentLearningObjective: LearningObjective @relation(name: "UserCurrentComponentStatusLearningObjective", direction: "OneWay")
    currentPracticeQuestion: QuestionBank @relation(name: "UserCurrentComponentStatusQuestionBank", direction: "OneWay")
    currentComponentType: CurrentComponentType!
  }
`;

export default UserCurrentComponentStatus;

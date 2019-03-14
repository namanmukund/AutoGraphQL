const userJourneyLearningObjectiveType = `
  type UserJourneyLearningObjectiveType {
   learningObjective: LearningObjective @relation(name: "UserJourneyLearningObjective", direction: "OneWay")
   isUnlocked: Boolean @defaultValue(value: "false")
 }`;

const UserTopicJourney = `
  type UserTopicJourney @model {
    user: User! @relation(name: "UserTopicJourney", direction: "OneWay")
    topic: Topic! @relation(name: "UserTopicJourneyTopic", direction: "OneWay")
    isVideoUnlocked: Boolean @defaultValue(value: "false")
    learningObjectives: [UserJourneyLearningObjectiveType]
    quizReport: UserQuizReport @relation(name: "UserTopicJourneyQuizReport")
    isQuizUnlocked: Boolean @defaultValue(value: "false")
  }
`;

export default [UserTopicJourney, userJourneyLearningObjectiveType];

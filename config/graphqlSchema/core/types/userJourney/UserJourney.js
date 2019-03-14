const userJourneyLearningObjectiveType = `
  type UserJourneyLearningObjectiveType {
   learningObjective: LearningObjective @relation(name: "UserJourneyLearningObjective", direction: "OneWay")
   isLocked: Boolean
 }`;

const userJourneyQuizType = `
  type UserJourneyQuizType {
   isLocked: Boolean
   quizReport: UserQuizReport @relation(name: "UserJourneyQuizReport")
 }`;

const UserJourney = `
  type UserJourney @model {
    user: User! @relation(name: "UserLO", direction: "OneWay")
    topic: Topic @relation(name: "UserJourneyTopic", direction: "OneWay")
    isVideoLocked: Boolean
    learningObjectives: [UserJourneyLearningObjectiveType]
    quizReport: UserQuizReport @relation(name: "UserJourneyQuizReport")
    isQuizLocked: Boolean
  }
`;

export default [UserJourney, userJourneyLearningObjectiveType, userJourneyQuizType];

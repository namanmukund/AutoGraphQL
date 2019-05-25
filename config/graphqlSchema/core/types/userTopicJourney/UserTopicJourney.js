const userJourneyLearningObjectiveType = `
  type UserJourneyLearningObjectiveType {
   id: ID
   title: String
   order: Int
   description: String
   thumbnail: File
   isUnlocked: Boolean @defaultValue(value: "false")
 }`;

const userQuizType = `
  type UserQuizType {
   masteryLevel: String
   title: String
   description: String
   thumbnail: File
   isUnlocked: Boolean @defaultValue(value: "false")
 }`;

const userVideoType = `
  type UserVideoType {
   title: String
   description: String
   thumbnail: File
   isUnlocked: Boolean @defaultValue(value: "false")
 }`;

const UserTopicJourney = `
  type UserTopicJourney {
    video: UserVideoType
    learningObjectives: [UserJourneyLearningObjectiveType]
    quiz: UserQuizType
  }
`;

export default [UserTopicJourney, userJourneyLearningObjectiveType, userQuizType, userVideoType];

const userJourneyLearningObjectiveType = `
  type UserJourneyLearningObjectiveType {
   id: ID
   title: String
   order: Int
   description: String
   thumbnail: File
   isUnlocked: Boolean @defaultValue(value: "false")
   chatStatus: UserTopicTypeStatus @defaultValue(value: "incomplete")
   practiceQuestionStatus: UserTopicTypeStatus @defaultValue(value: "incomplete")
 }`;

const userQuizType = `
  type UserQuizType {
   masteryLevel: String
   title: String
   description: String
   thumbnail: File
   isUnlocked: Boolean @defaultValue(value: "false")
   status: UserTopicTypeStatus @defaultValue(value: "incomplete")
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
    topicStatus: UserTopicTypeStatus
  }
`;

export default [UserTopicJourney, userJourneyLearningObjectiveType, userQuizType, userVideoType];

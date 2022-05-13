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
   comicStripStatus: UserTopicTypeStatus @defaultValue(value: "incomplete")
   learningSlideStatus: UserTopicTypeStatus @defaultValue(value: "incomplete")
   order: Int
 }`;

const userQuizType = `
  type UserQuizType {
   masteryLevel: String
   title: String
   description: String
   thumbnail: File
   isUnlocked: Boolean @defaultValue(value: "false")
   status: UserTopicTypeStatus @defaultValue(value: "incomplete")
   order: Int
 }`;

const userVideoType = `
  type UserVideoType {
   id: ID
   title: String
   description: String
   thumbnail: File
   isUnlocked: Boolean @defaultValue(value: "false")
   order: Int
 }`;

const userBlockBasedProjectType = `
  type UserBlockBasedProjectType {
   id: ID
   title: String
   description: String
   thumbnail: File
   isUnlocked: Boolean @defaultValue(value: "false")
   order: Int
 }`;

const UserTopicJourney = `
  type UserTopicJourney {
    video: UserVideoType
    learningObjectives: [UserJourneyLearningObjectiveType]
    quiz: UserQuizType
    blockBasedPractices: [UserBlockBasedProjectType]
    blockBasedProjects: [UserBlockBasedProjectType]
    topicStatus: UserTopicTypeStatus
    videos: [UserVideoType]
  }
`;

export default [UserTopicJourney, userJourneyLearningObjectiveType, userQuizType, userVideoType, userBlockBasedProjectType];

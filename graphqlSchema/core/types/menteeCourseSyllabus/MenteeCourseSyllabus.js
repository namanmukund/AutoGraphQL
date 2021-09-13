const sessionDetailType = `
  type SessionDetailType {
   chapterId: ID
   chapterOrder: Int
   chapterTitle: String
   topicId: ID
   topicTitle: String
   topicThumbnail: File
   topicThumbnailSmall: File
   topicDescription: String
   topicOrder: Int
   bookingDate: Date
   slotTime: Int
   isAccessible: Boolean
 }`;

const completedSessionDetailType = `
  type CompletedSessionDetailType {
   chapterId: ID
   chapterOrder: Int
   chapterTitle: String
   topicId: ID
   topicTitle: String
   topicThumbnail: File
   topicThumbnailSmall: File
   topicDescription: String
   topicOrder: Int
   endingDate: Date
   mentorId: String
   mentorName: String
   mentorProfilePic: File
 }`;

const menteeCourseSyllabusSkills = `
  type MenteeCourseSyllabusSkills {
   name: String
   order: Int
   description: String
   image: File @relation(name: "UserBadgeImage", direction: "OneWay")
   isUnlocked: Boolean @defaultValue(value: "false")
   unlockPoint: CurrentTopicComponentType!
 }`;

const menteeCourseSyllabusCourse = `
  type MenteeCourseSyllabusCourse {
   title: String
   description: String
   bannerTitle: String
   bannerDescription: String
   badgeDescription: String
   chapterCount: Int
   topicCount: Int
   projectCount: Int
   practiceCount: Int
   courseCompletionPercentage: Float
 }`;

const menteeCourseSyllabusMentor = `
  type MenteeCourseSyllabusMentor {
   id: ID
   name: String
   description: String
   averageRating: Float
   experienceYear: Int
   gitHubLink: String
   linkedInLink: String
   portfolioLink: String
   profilePic: File
   sessionLink: String
   googleMeetLink: String
 }`;

const menteeCourseSyllabusProject = `
  type MenteeCourseSyllabusProject {
   title: String
   projectThumbnail: File
   tags: [ContentTag]
 }`;

const firstComponent = `
  type FirstComponent {
   componentName: String,
   childComponentName: String,
   componentId: ID,
 }`;

const PreviousTopicComponentRule = `
 type PreviousTopicComponentRule {
   componentName: String,
   order: Int,
 }
`;
const PreviousTopic = `
  type PreviousTopic {
    topicComponentRule: [PreviousTopicComponentRule],
    topicId: ID,
 }`;

const MenteeCourseSyllabus = `
  type MenteeCourseSyllabus {
    upComingSession: [SessionDetailType]
    bookedSession: [SessionDetailType]
    completedSession: [CompletedSessionDetailType]
    totalChapters: Int
    totalTopics: Int
    isPaid: Boolean @defaultValue(value: "false")
    course: MenteeCourseSyllabusCourse
    skills: [MenteeCourseSyllabusSkills]
    mentor: MenteeCourseSyllabusMentor
    projects: [MenteeCourseSyllabusProject]
    firstComponent: FirstComponent 
    previousTopic: PreviousTopic
  }
`;

export default [MenteeCourseSyllabus, sessionDetailType, completedSessionDetailType, menteeCourseSyllabusCourse, menteeCourseSyllabusSkills, menteeCourseSyllabusMentor, menteeCourseSyllabusProject, firstComponent, PreviousTopicComponentRule, PreviousTopic];

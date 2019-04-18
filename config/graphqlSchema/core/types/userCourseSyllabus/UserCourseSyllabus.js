const topicsUserCourseSyllabusType = `
  type TopicsUserCourseSyllabusType {
   id: ID
   title: String
   order: Int
   thumbnail: File
   description: String
   videoTitle: String
   isUnlocked: Boolean @defaultValue(value: "false")
 }`;

const chaptersUserCourseSyllabusType = `
  type ChaptersUserCourseSyllabusType {
   id: ID
   title: String
   order: Int
   topics: [TopicsUserCourseSyllabusType]
 }`;

const currentTopicComponentDetailType = `
  type CurrentTopicComponentDetailType {
   componentTitle: String
   topicTitle: String
   thumbnail: File 
   percentageCovered: Int
   description: String
 }`;

const courseUserCourseSyllabus = `
  type CourseUserCourseSyllabus {
   id: ID
   title: String
 }`;

const UserCourseSyllabus = `
  type UserCourseSyllabus {
    currentCourse: CourseUserCourseSyllabus
    currentTopicComponent: CurrentTopicComponentType!
    currentTopicComponentDetail: CurrentTopicComponentDetailType
    chapters: [ChaptersUserCourseSyllabusType]
    totalChapters: Int
    totalTopics: Int
  }
`;

export default [UserCourseSyllabus, currentTopicComponentDetailType,
  chaptersUserCourseSyllabusType, topicsUserCourseSyllabusType, courseUserCourseSyllabus];

const topicsUserCourseSyllabusType = `
  type TopicsUserCourseSyllabusType {
   title: String
   order: Int
   thumbnail: File
   description: String
   videoTitle: String
   isUnlocked: Boolean @defaultValue(value: "false")
 }`;

const chaptersUserCourseSyllabusType = `
  type ChaptersUserCourseSyllabusType {
   title: String
   order: Int
   topics: [TopicsUserCourseSyllabusType]
 }`;

const currentComponentDataType = `
  type CurrentComponentDataType {
   componentTitle: String
   topicTitle: String
   thumbnail: File 
   percentageCovered: Int
   description: String
 }`;

const courseUserCourseSyllabus = `
  type CourseUserCourseSyllabus {
   title: String
 }`;

const UserCourseSyllabus = `
  type UserCourseSyllabus {
    user: User!
    currentCourse: CourseUserCourseSyllabus
    currentComponent: CurrentComponentType!
    currentComponentData: CurrentComponentDataType
    chapters: [ChaptersUserCourseSyllabusType]
  }
`;

export default [UserCourseSyllabus, currentComponentDataType,
  chaptersUserCourseSyllabusType, topicsUserCourseSyllabusType, courseUserCourseSyllabus];

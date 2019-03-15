const topicsUserCourseSyllabusType = `
  type TopicsUserCourseSyllabusType {
   topic: Topic
   isUnlocked: Boolean @defaultValue(value: "false")
 }`;

const chaptersUserCourseSyllabusType = `
  type ChaptersUserCourseSyllabusType {
   chapter: Chapter
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

const UserCourseSyllabus = `
  type UserCourseSyllabus {
    user: User!
    currentCourse: Course!
    currentComponent: CurrentComponentType!
    currentComponentData: CurrentComponentDataType
    chapters: [ChaptersUserCourseSyllabusType]
  }
`;

export default [UserCourseSyllabus, currentComponentDataType,
  chaptersUserCourseSyllabusType, topicsUserCourseSyllabusType];

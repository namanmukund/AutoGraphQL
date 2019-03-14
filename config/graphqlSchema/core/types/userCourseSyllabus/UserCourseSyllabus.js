const topicsUserCourseSyllabusType = `
  type TopicsUserCourseSyllabusType {
   topic: Topic @relation(name: "UserCourseSyllabusTopic", direction: "OneWay")
   isUnlocked: Boolean @defaultValue(value: "false")
 }`;

const chaptersUserCourseSyllabusType = `
  type ChaptersUserCourseSyllabusType {
   topics: [TopicsUserCourseSyllabusType]
   isUnlocked: Boolean @defaultValue(value: "false")
 }`;

const currentComponentDataType = `
  type CurrentComponentDataType {
   title: String
   thumbnail: File @relation(name: "UserHomepageThumbnail", direction: "OneWay")
   percentageCovered: Int
   description: String
 }`;

const UserCourseSyllabus = `
  type UserCourseSyllabus {
    user: User! @relation(name: "UserCourseSyllabus", direction: "OneWay")
    course: Course! @relation(name: "UserCourseSyllabusCourse", direction: "OneWay")
    currentComponent: CurrentComponentType!
    currentComponentData: CurrentComponentDataType
    chapters: [ChaptersUserCourseSyllabusType]
  }
`;

export default [UserCourseSyllabus, currentComponentDataType,
  chaptersUserCourseSyllabusType, topicsUserCourseSyllabusType];

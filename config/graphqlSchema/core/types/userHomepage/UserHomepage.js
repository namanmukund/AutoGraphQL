const topicHomepageType = `
  type TopicHomepageType {
   topic: Topic @relation(name: "UserHomepageTopic", direction: "OneWay")
   chapter: Chapter @relation(name: "UserHomepageChapter", direction: "OneWay")
   isLocked: Boolean
 }`;

const currentComponentDataType = `
  type CurrentComponentDataType {
   title: String
   thumbnail: File @relation(name: "UserHomepageThumbnail", direction: "OneWay")
   percentageCovered: Int
   description: String
 }`;

const UserHomepage = `
  type UserHomepage @model {
    user: User! @relation(name: "UserHomepage", direction: "OneWay")
    course: Course! @relation(name: "UserSyllabusCourse", direction: "OneWay")
    currentComponent: CurrentComponentType
    currentComponentData: CurrentComponentDataType
    topics: [TopicHomepageType]
  }
`;

export default [UserHomepage, currentComponentDataType, topicHomepageType];

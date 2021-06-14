const userBadgeArray = `
  type UserBadgeArray {
   name: String
   order: Int
   description: String
   image: File @relation(name: "UserBadgeImage", direction: "OneWay")
   isUnlocked: Boolean @defaultValue(value: "false")
   unlockPoint: CurrentTopicComponentType!
 }`;

const courseUserBadge = `
  type CourseUserBadge {
   id: ID
   title: String
 }`;

const UserBadge = `
  type UserBadge {
    currentCourse: CourseUserBadge
    characters: [UserBadgeArray]
    equipments: [UserBadgeArray]
    skills: [UserBadgeArray]
  }
`;

export default [UserBadge, userBadgeArray, courseUserBadge];

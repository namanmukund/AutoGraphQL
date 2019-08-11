const userBadgeArray = `
  type UserBadgeArray {
   name: String
   order: Int
   image: File @relation(name: "UserBadgeImage", direction: "OneWay")
   isUnlocked: Boolean @defaultValue(value: "false")
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
  }
`;

export default [UserBadge, userBadgeArray, courseUserBadge];

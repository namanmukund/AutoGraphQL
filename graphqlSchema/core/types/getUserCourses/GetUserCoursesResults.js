const GetUserCoursesResults = `
  type GetUserCoursesResults {
    id: ID
    title: String
    secondaryCategory: String
    thumbnail: File @relation(name: "UserCourseThumbnail", direction: "OneWay")
    currentTopic: Topic @relation(name: "UserCourseTopic", direction: "OneWay")
    isCourseCompleted: Boolean
  }
`;

export default [GetUserCoursesResults];

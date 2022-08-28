const ClassroomDetails = `
  type UserClassroomDetails {
    id: ID
    code: String
    title: String
  }
`;

const GetUserCoursesResults = `
  type GetUserCoursesResults {
    id: ID
    title: String
    courseId: ID
    secondaryCategory: String
    thumbnail: File @relation(name: "UserCourseThumbnail", direction: "OneWay")
    currentTopic: Topic @relation(name: "UserCourseTopic", direction: "OneWay")
    allottedMentor: User
    isCourseCompleted: Boolean
    classroom: UserClassroomDetails
    activeClassroom: Boolean
  }
`;

export default [GetUserCoursesResults, ClassroomDetails];

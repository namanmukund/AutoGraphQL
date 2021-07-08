import { TBA, TLA, TWA } from '../../../../constants';

const UserCourseRating = `
  type UserCourseRating @model
  @appPermissions(
    permissions:[
      { appName: "${TLA}" operations: "*" },
      { appName: "${TBA}" operations: "*" },
      { appName: "${TWA}" operations: "*" },
      ], 
    rule: allow
  )
  {
    course: Course! @relation(name: "UserCourseRatingCourse", direction: "OneWay")
      @appPermissions(
        permissions:[
          { appName: "${TBA}" operations: "*" },
          ], 
        rule: allow
      )
    user: User! @relation(name: "UserCourseRatingUser", direction: "OneWay")
      @appPermissions(
        permissions:[
          { appName: "${TBA}" operations: "*" },
          ], 
        rule: allow
      )
    rating: Int!
    comment: String
  }
`;

export default UserCourseRating;

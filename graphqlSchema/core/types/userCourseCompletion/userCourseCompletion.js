import { TBA, TLA, TWA } from '../../../../constants';

const UserCourseCompletion = `
  type UserCourseCompletion @model
  @appPermissions(
    permissions:[
      { appName: "${TLA}" operations: "*" },
      { appName: "${TBA}" operations: "*" },
      { appName: "${TWA}" operations: "*" },
      ], 
    rule: allow
  )
  {
    course: Course! @relation(name: "UserCourseCompletion", direction: "OneWay")
      @appPermissions(
        permissions:[
          { appName: "${TBA}" operations: "*" },
          ], 
        rule: allow
      )
    user: User! @relation(name: "UserCourseCompletion", direction: "OneWay")
      @appPermissions(
        permissions:[
          { appName: "${TBA}" operations: "*" },
          ], 
        rule: allow
      )
    mentors: [User] @relation(name: "UserCourseCompletionMentors", direction: "OneWay")
    rating: Int
    comment: String
    courseDuration: String
    courseEndingDate: String
    proficiency: String
    certificate: File @relation(name: "Certificate", direction: "OneWay")
  }
`;

export default UserCourseCompletion;

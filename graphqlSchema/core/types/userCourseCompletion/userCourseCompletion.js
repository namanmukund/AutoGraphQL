import { TBA, TLA, TWA, TMS } from '../../../../constants';

const UserCourseCompletion = `
  type UserCourseCompletion @model
  @appPermissions(
    permissions:[
      { appName: "${TLA}" operations: "*" },
      { appName: "${TBA}" operations: "*" },
      { appName: "${TWA}" operations: "*" },
      { appName: "${TMS}" operations: "*" },
      ], 
    rule: allow
  )
  {
    course: Course! @relation(name: "UserCourseCompletion", direction: "OneWay")
      @appPermissions(
        permissions:[
          { appName: "${TBA}" operations: "*" },
          { appName: "${TMS}" operations: "*" },
          ], 
        rule: allow
      )
    user: User! @relation(name: "UserCourseCompletion", direction: "OneWay")
      @appPermissions(
        permissions:[
          { appName: "${TBA}" operations: "*" },
          { appName: "${TMS}" operations: "*" },
          ], 
        rule: allow
      )
    mentors: [User] @relation(name: "UserCourseCompletionMentors", direction: "OneWay")
    rating: Int
    comment: String
    mentorComment: String
    courseDuration: String
    courseEndingDate: String
    topicsCompleted: Int
    proficientTopicCount: Int
    masteredTopicCount: Int
    familiarTopicCount: Int
    certificate: File @relation(name: "Certificate", direction: "OneWay")
    journeySnapshot: File @relation(name: "JourneySnapshot", direction: "OneWay")
  }
`;

export default UserCourseCompletion;

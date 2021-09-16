import {
  TBA, TLA, TMS, TWA,
} from '../../../../constants';
import { READ } from '../../../../constants/graphqlOperations';

const HomeworkStreaksType = `
  type HomeworkStreaksType {
    homeworkSubmitDate: Date,
    mentorMenteeSession: MentorMenteeSession @relation(name: "UserCourseMentorMenteeSession", direction: "OneWay")
  }
`
const UserCourse = `
  type UserCourse @model
  @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: "*" },
      { appName: "${TLA}" operations: "*" }, 
      { appName: "${TBA}" operations: "*" }, 
      { appName: "${TWA}" operations: ${READ} },
      ], 
    rule: allow
  )
  {
    courses: [Course] @relation(name: "CourseUserCourse", direction: "OneWay")
      @appPermissions(
        permissions:[
          { appName: "${TMS}" operations: "*" },
          { appName: "${TLA}" operations: "*" },
          { appName: "${TWA}" operations: ${READ} },
          ], 
        rule: allow
      )
    user: User! @relation(name: "UserCourseUser", direction: "OneWay")
      @appPermissions(
        permissions:[
          { appName: "${TBA}" operations: "*" },
          { appName: "${TMS}" operations: "*" },
          ], 
        rule: allow
      )
    homeworkStreaks: [HomeworkStreaksType]
    homeworkStreaksLog: [HomeworkStreaksType]
  }
`;

export default [UserCourse, HomeworkStreaksType];

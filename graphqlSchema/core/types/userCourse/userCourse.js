import {
  TBA, TLA, TMS, TWA,
} from '../../../../constants';
import { READ } from '../../../../constants/graphqlOperations';

const HomeworkStreaksType = `
  type HomeworkStreaks {
    course: Course @relation(name: "CourseHomeworkStreaks", direction: "OneWay")
      @appPermissions(
        permissions:[
          { appName: "${TMS}" operations: ${READ} },
          { appName: "${TLA}" operations: ${READ} },
          { appName: "${TWA}" operations: ${READ} },
          { appName: "${TBA}" operations: "*" },
          ], 
        rule: allow
      )
    mentorMenteeSession: MentorMenteeSession @relation(name: "UserCourseMentorMenteeSession", direction: "OneWay")
    createdAt: Date
  }
`;

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
    homeworkStreaks: [HomeworkStreaks]
    homeworkStreaksLog: [HomeworkStreaks]
  }
`;

export default [UserCourse, HomeworkStreaksType];

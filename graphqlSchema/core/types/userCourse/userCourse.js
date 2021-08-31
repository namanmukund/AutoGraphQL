import {
  TBA, TLA, TMS, TWA,
} from '../../../../constants';
import { READ } from '../../../../constants/graphqlOperations';

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
    courses: [Course] @relation(name: "UserCourse", direction: "OneWay")
      @appPermissions(
        permissions:[
          { appName: "${TMS}" operations: "*" },
          { appName: "${TLA}" operations: "*" },
          { appName: "${TWA}" operations: ${READ} },
          ], 
        rule: allow
      )
    user: User! @relation(name: "UserCourse", direction: "OneWay")
      @appPermissions(
        permissions:[
          { appName: "${TBA}" operations: "*" },
          ], 
        rule: allow
      )
  }
`;

export default UserCourse;

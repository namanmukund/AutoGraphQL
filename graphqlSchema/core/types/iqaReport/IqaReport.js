import {
  TBA, TLA, TMS, TWA,
} from '../../../../constants';
import { READ } from '../../../../constants/graphqlOperations';

const IqaReport = `
  type IqaReport @model
  @userToken(isRequired:"false")
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
    course: Course @relation(name: "CourseIqaReport", direction: "OneWay")
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
    email: String!
    phone: Phone!
    tekieUrl: String
    assetUrl: String
    iqaScore: Int!
    maximumScore: Int!
    iqaRank: Int!
    globalRank: Int!
  }
`;

export default [IqaReport];

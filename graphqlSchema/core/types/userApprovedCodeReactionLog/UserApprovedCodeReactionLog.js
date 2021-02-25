import { TBA, TWA } from '../../../../constants';
import { READ } from '../../../../constants/graphqlOperations';

const UserApprovedCodeReactionLog = `
  type UserApprovedCodeReactionLog @model
  @appPermissions(
    permissions:[
      { appName: "${TBA}" operations: "*" },
      { appName: "${TWA}" operations: ${READ}  },
      ], 
    rule: allow
  ) 
  {
    user: User! @relation(name: "UserApprovedCodeReactionLogUser", direction: "OneWay")
    @appPermissions(
        permissions:[
          { appName: "${TBA}" operations: "*" },
          ], 
        rule: allow
      )
    userApprovedCode: UserApprovedCode! @relation(name: "UserApprovedCodeReactionLogUserUserApprovedCode", direction: "OneWay")
    reactedBy: User! @relation(name: "UserApprovedCodeReactionLogReactedBy", direction: "OneWay")
    hot: Boolean @defaultValue(value: "false") 
    heart: Boolean @defaultValue(value: "false")
    celebrate: Boolean @defaultValue(value: "false")     
  }
`;

export default [UserApprovedCodeReactionLog];

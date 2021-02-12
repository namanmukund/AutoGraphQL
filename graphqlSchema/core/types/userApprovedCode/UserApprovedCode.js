import { TBA, TMS, TWA } from '../../../../constants';
import { READ } from '../../../../constants/graphqlOperations';

const UserApprovedCode = `
  type UserApprovedCode @model 
  @appPermissions(
    permissions:[
      { appName: "${TBA}" operations: "*" },
      { appName: "${TMS}" operations: ${READ} },
      { appName: "${TWA}" operations: ${READ} }
      ], 
    rule: allow
  ) 
  {
    user: User! @relation(name: "UserApprovedCodeUser", direction: "OneWay")
      @appPermissions(
        permissions:[
          { appName: "${TMS}" operations: ${READ} },
          { appName: "${TWA}" operations: ${READ} }
          ], 
        rule: deny
      ) 
    userSavedCode: UserSavedCode! @relation(name: "UserApprovedCodeUserSavedCode")
       @appPermissions(
        permissions:[
          { appName: "${TMS}" operations: ${READ} },
          { appName: "${TWA}" operations: ${READ} }
          ], 
        rule: deny
      ) 
    studentName: String! @trim
    studentGrade: Grade! @trim
    approvedCode: String! @trim
    approvedFileName: String! @trim
    approvedDescription: String! @trim
    heartReactionCount: Int @defaultValue(value: 0)
    celebrateReactionCount: Int @defaultValue(value: 0)
    hotReactionCount: Int @defaultValue(value: 0)
    totalReactionCount: Int @defaultValue(value: 0)
    userApprovedCodeTagMappings:[UserApprovedCodeTagMapping] @relation(name: "UserApprovedCodeTagMappingCode")
    status: ContentStatus! @defaultValue(value: "unpublished")      
  }
`;

export default [UserApprovedCode];

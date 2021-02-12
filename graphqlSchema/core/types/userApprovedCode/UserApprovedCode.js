import { TBA, TMS, TWA } from '../../../../constants';
import { READ } from '../../../../constants/graphqlOperations';

const UserApprovedCode = `
  type UserApprovedCode @model 
  @appPermissions(
    permissions:[
      { appName: "${TBA}" operations: "*" },
      { appName: "${TMS}" operations: "*" },
      { appName: "${TWA}" operations: ${READ} }
      ], 
    rule: allow
  ) 
  {
    user: User! @relation(name: "UserApprovedCodeUser", direction: "OneWay")
      @appPermissions(
        permissions:[
          { appName: "${TBA}" operations: "*" },
          ], 
        rule: allow
      ) 
    userSavedCode: UserSavedCode! @relation(name: "UserApprovedCodeUserSavedCode")
       @appPermissions(
        permissions:[
          { appName: "${TBA}" operations: "*" },
          ], 
        rule: allow
      ) 
    studentName: String! @trim
      @appPermissions(
        permissions:[
          { appName: "${TBA}" operations: "*" },
          ], 
        rule: allow
      ) 
    studentGrade: Grade! @trim
      @appPermissions(
        permissions:[
          { appName: "${TBA}" operations: "*" },
          ], 
        rule: allow
      ) 
    heartReactionCount: Int @defaultValue(value: 0)
      @appPermissions(
        permissions:[
          { appName: "${TBA}" operations: "*" },
          ], 
        rule: allow
      ) 
    celebrateReactionCount: Int @defaultValue(value: 0)
      @appPermissions(
        permissions:[
          { appName: "${TBA}" operations: "*" },
          ], 
        rule: allow
      ) 
    hotReactionCount: Int @defaultValue(value: 0)
      @appPermissions(
        permissions:[
          { appName: "${TBA}" operations: "*" },
          ], 
        rule: allow
      )
    totalReactionCount: Int @defaultValue(value: 0)
      @appPermissions(
        permissions:[
          { appName: "${TBA}" operations: "*" },
          ], 
        rule: allow
      )
    approvedCode: String! @trim
    approvedFileName: String! @trim
    approvedDescription: String @trim
    userApprovedCodeTagMappings:[UserApprovedCodeTagMapping] @relation(name: "UserApprovedCodeTagMappingCode")
    status: ContentStatus! @defaultValue(value: "unpublished")      
  }
`;

export default [UserApprovedCode];

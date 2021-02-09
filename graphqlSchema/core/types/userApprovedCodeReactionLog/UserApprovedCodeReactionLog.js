import { TBA } from '../../../../constants';

const UserApprovedCodeReactionLog = `
  type UserApprovedCodeReactionLog @model 
  @appPermissions(
    permissions:[
      { appName: "${TBA}" operations: "*" },
      ], 
    rule: allow
  ) 
  {
    user: User! @relation(name: "UserApprovedCodeReactionLogUser", direction: "OneWay")
    userApprovedCode: UserApprovedCode! @relation(name: "UserApprovedCodeReactionLogUserUserApprovedCode", direction: "OneWay")
    reactedBy: User! @relation(name: "UserApprovedCodeReactionLogReactedBy", direction: "OneWay")
    reactionType: ReactionType!     
  }
`;

export default [UserApprovedCodeReactionLog];

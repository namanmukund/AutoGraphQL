const UserSavedCode = `
  type UserSavedCode @model 
   {  
    user: User! @relation(name: "UserSavedCodeUser", direction: "OneWay")
    code: String! @trim
    fileName: String! @trim
    description: String @trim
    hasRequestedByMentee: Boolean @defaultValue(value: "false")
    isApprovedForDisplay: UserSavedCodeStatus @defaultValue(value: "pending")
    userApprovedCode: UserApprovedCode @relation(name: "UserApprovedCodeUserSavedCode")
  }
`;

export default UserSavedCode;

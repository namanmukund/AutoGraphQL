const UserSavedCode = `
  type UserSavedCode @model 
   {  
    user: User! @relation(name: "UserSavedCodeUser", direction: "OneWay")
    code: String! @trim
    fileName: String! @trim
    description: String @trim
    isApprovedForDisplay: Boolean @defaultValue(value: "false")
    userApprovedCode: UserApprovedCode @relation(name: "UserApprovedCodeUserSavedCode")
  }
`;

export default UserSavedCode;

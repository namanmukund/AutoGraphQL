const UserSavedCode = `
  type UserSavedCode @model 
   {  
    user: User! @relation(name: "UserCreditUser", direction: "OneWay")
    code: String! @trim
    fileName: String! @trim
    description: String @trim
  }
`;

export default UserSavedCode;

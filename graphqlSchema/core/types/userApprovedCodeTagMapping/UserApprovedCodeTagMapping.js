const UserApprovedCodeTagMapping = `
  type UserApprovedCodeTagMapping @model
  @userToken(isRequired:"false")  
  {
    title: String @groupBy
    userApprovedCode: UserApprovedCode! @relation(name: "UserApprovedCodeTagMappingCode")
    userApprovedCodeTag: UserApprovedCodeTag! @relation(name: "UserApprovedCodeTagMappingTag", direction: "OneWay") 
  }
`;

export default [UserApprovedCodeTagMapping];

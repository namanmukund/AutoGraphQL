const UserApprovedCodeTagMapping = `
  type UserApprovedCodeTagMapping @model 
  {
    UserApprovedCode: UserApprovedCode! @relation(name: "UserApprovedCodeTagMappingCode")
    UserApprovedCodeTag: UserApprovedCodeTag! @relation(name: "UserApprovedCodeTagMappingTag", direction: "OneWay") 
  }
`;

export default [UserApprovedCodeTagMapping];

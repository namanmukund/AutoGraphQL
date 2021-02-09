const UserApprovedCodeTag = `
  type UserApprovedCodeTag @model 
  {
    title: String! @trim
    codeCount: Int @defaultValue(value: 0)    
  }
`;

export default [UserApprovedCodeTag];

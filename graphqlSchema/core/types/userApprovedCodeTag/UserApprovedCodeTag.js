const UserApprovedCodeTag = `
  type UserApprovedCodeTag @model 
  {
    title: String! @unique @trim
    codeCount: Int @defaultValue(value: 0)    
  }
`;

export default [UserApprovedCodeTag];

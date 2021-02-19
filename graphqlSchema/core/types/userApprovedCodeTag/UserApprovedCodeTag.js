const UserApprovedCodeTag = `
  type UserApprovedCodeTag @model 
  {
    title: String! @unique @trim
    codeCount: Int @defaultValue(value: 0)
    status: ContentStatus @defaultValue(value: "unpublished")    
  }
`;

export default [UserApprovedCodeTag];

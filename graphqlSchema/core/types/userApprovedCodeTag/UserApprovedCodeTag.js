const UserApprovedCodeTag = `
  type UserApprovedCodeTag @model
  @userToken(isRequired:"false") 
  {
    title: String! @unique @trim
    codeCount: Int @defaultValue(value: 0)
    status: ContentStatus @defaultValue(value: "unpublished")    
  }
`;

export default [UserApprovedCodeTag];

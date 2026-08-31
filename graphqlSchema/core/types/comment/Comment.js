const Comment = `
  type Comment @model {
    content: String! @trim
    status: CommentStatus! @defaultValue(value: "approved")
    author: User! @relation(name: "UserComments")
    post: Post! @relation(name: "PostComments")
  }
`;

export default [Comment];

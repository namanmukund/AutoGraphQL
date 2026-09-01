const Tag = `
  type Tag @model {
    name: String! @trim @nameCase
    slug: String! @unique @trim
    posts: [Post] @relation(name: "TagPosts")
  }
`;

export default [Tag];

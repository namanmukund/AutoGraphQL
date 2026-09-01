const Category = `
  type Category @model {
    name: String! @trim @nameCase
    slug: String! @unique @trim
    description: String
    posts: [Post] @relation(name: "CategoryPosts")
  }
`;

export default [Category];

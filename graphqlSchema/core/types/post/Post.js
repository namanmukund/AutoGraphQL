const Post = `
  type Post @model {
    title: String! @trim
    slug: String! @unique @trim
    content: String!
    excerpt: String
    status: PostStatus! @defaultValue(value: "draft")
    isFeatured: Boolean @defaultValue(value: "false")
    viewsCount: Int @defaultValue(value: "0")
    featuredImage: File @relation(name: "PostFeaturedImage", direction: "OneWay", isSubset: true)
    author: User! @relation(name: "UserPosts")
    category: Category @relation(name: "CategoryPosts", direction: "OneWay")
    tags: [Tag] @relation(name: "TagPosts")
    comments: [Comment] @relation(name: "PostComments")
  }
`;

export default [Post];

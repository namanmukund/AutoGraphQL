const ContentTag = `
  type ContentTag @model 
  {
    title: String! @unique @trim
    status: ContentStatus @defaultValue(value: "unpublished")
    cheatSheet: [CheatSheet] @relation(name: "CheatSheetContentTag")
  }
`;

export default [ContentTag];

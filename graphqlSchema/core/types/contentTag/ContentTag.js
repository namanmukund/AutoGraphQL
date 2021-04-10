const ContentTag = `
  type ContentTag @model 
  {
    title: String! @unique @trim
    status: ContentStatus @defaultValue(value: "unpublished")
    cheatSheet: [CheatSheet] @relation(name: "CheatSheetContentTag")
    workbook: [Workbook] @relation(name: "WorkbookContentTag")
  }
`;

export default [ContentTag];

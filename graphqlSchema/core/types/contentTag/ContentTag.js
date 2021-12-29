const ContentTag = `
  type ContentTag @model 
  {
    title: String! @unique @trim
    status: ContentStatus @defaultValue(value: "unpublished")
    cheatSheet: [CheatSheet] @relation(name: "CheatSheetContentTag")
    workbook: [Workbook] @relation(name: "WorkbookContentTag")
    blockBasedProject: [BlockBasedProject] @relation(name: "BlockBasedProjectTag")
    questionBank: [QuestionBank] @relation(name: "ContentTagQuestionBank")
    event: [Event] @relation(name: "ContentTagEvent")
    tagStatus : TagStatus
  }
`;

export default [ContentTag];

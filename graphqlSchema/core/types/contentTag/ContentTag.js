import { TBA, TMS } from '../../../../constants';

const ContentTag = `
  type ContentTag @model 
  @userToken(isRequired:"false")
  {
    title: String! @unique @trim
    status: ContentStatus @defaultValue(value: "unpublished")
    cheatSheet: [CheatSheet] @relation(name: "CheatSheetContentTag")
    @appPermissions(
        permissions:[
          { appName: "${TBA}" operations: "*" },
          { appName: "${TMS}" operations: "*" }],
        rule: allow
      ) 
    workbook: [Workbook] @relation(name: "WorkbookContentTag")
    @appPermissions(
        permissions:[
          { appName: "${TBA}" operations: "*" },
          { appName: "${TMS}" operations: "*" }],
        rule: allow
      ) 
    blockBasedProject: [BlockBasedProject] @relation(name: "BlockBasedProjectTag")
    @appPermissions(
        permissions:[
          { appName: "${TBA}" operations: "*" },
          { appName: "${TMS}" operations: "*" }],
        rule: allow
      ) 
    questionBank: [QuestionBank] @relation(name: "ContentTagQuestionBank")
    @appPermissions(
        permissions:[
          { appName: "${TBA}" operations: "*" },
          { appName: "${TMS}" operations: "*" }],
        rule: allow
      ) 
    events: [Event] @relation(name: "ContentTagEvent")
    tagStatus : EventStatus
    displayOnWebsite: Boolean
    isEventTag: Boolean
    createdBy: User @relation(name: "ContentTagUser", direction: "OneWay")
    @appPermissions(
        permissions:[
          { appName: "${TBA}" operations: "*" },
          { appName: "${TMS}" operations: "*" }],
        rule: allow
      ) 
  }
`;

export default [ContentTag];

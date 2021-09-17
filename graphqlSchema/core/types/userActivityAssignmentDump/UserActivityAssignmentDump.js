const assignmentQuestionsType = `
  type AssignmentQuestionsType {
   assignmentQuestion: AssignmentQuestion @relation(name: "AssignmentQuestionUserActivityAssignmentDump", direction: "OneWay")
   assignmentQuestionDisplayOrder: Int
   isAttempted: Boolean @defaultValue(value: "false")
   userAnswerCodeSnippet: String @trim
 }`;

const UserActivityAssignmentDump = `
  type UserActivityAssignmentDump @model {
    user: User! @relation(name: "UserActivityAssignmentDump", direction: "OneWay")
    assignmentQuestions: [AssignmentQuestionsType]
    assignmentAction: UserActionType
    isHomework: Boolean @defaultValue(value: "false")
    topic: Topic @relation(name: "TopicUserActivityAssignmentDump", direction: "OneWay")
    course: Course @relation(name: "UserActivityAssignmentDumpCourse", direction: "OneWay")
  }
`;

export default [UserActivityAssignmentDump, assignmentQuestionsType];

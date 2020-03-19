const assignmentQuestionsType = `
  type AssignmentQuestionsType {
   assignmentQuestion: AssignmentQuestion @relation(name: "AssignmentQuestionUserActivityAssignmentDump", direction: "OneWay")
   assignmentQuestionDisplayOrder: Int
   isAttempted: Boolean @defaultValue(value: "false")
   userAnswer: String @trim
 }`;

const UserActivityAssignmentDump = `
  type UserActivityAssignmentDump @model {
    user: User! @relation(name: "UserActivityAssignmentDump", direction: "OneWay")
    assignmentQuestions: [AssignmentQuestionsType]
    assignmentAction: UserActionType
    topic: Topic @relation(name: "TopicUserActivityAssignmentDump", direction: "OneWay")
  }
`;

export default [UserActivityAssignmentDump, assignmentQuestionsType];

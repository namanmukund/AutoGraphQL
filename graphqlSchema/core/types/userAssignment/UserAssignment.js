const assignmentType = `
  type AssignmentType {
   assignmentQuestion: AssignmentQuestion @relation(name: "UserAssignmentQuestion", direction: "OneWay")
   assignmentQuestionDisplayOrder: Int
   isAttempted: Boolean @defaultValue(value: "false")
   userAnswerCodeSnippet: String @trim
   result: EvaluationResult @defaultValue(value: "pending")
 }`;

const UserAssignment = `
  type UserAssignment @model {
    user: User! @relation(name: "UserAssignment", direction: "OneWay")
    assignmentStatus: UserTopicTypeStatus @defaultValue(value: "incomplete")
    assignment: [AssignmentType]
    topic: Topic! @relation(name: "TopicUserAssignment", direction: "OneWay")
    course: Course @relation(name: "UserAssignmentCourse", direction: "OneWay")
  }
`;

export default [UserAssignment, assignmentType];

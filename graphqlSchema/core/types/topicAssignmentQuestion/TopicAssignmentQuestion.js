const TopicAssignmentQuestion = `
  type TopicAssignmentQuestion @model
  {
   order: Int
   assignmentQuestion: AssignmentQuestion @relation(name: "TopicAssignmentQuestion")
  }
`;

export default TopicAssignmentQuestion;

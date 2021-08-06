const TopicAssignmentQuestion = `
  type TopicAssignmentQuestion
  {
   order: Int
   assignmentQuestion: AssignmentQuestion @relation(name: "AssignmentTopicAssignmentQuestion")
  }
`;

export default TopicAssignmentQuestion;

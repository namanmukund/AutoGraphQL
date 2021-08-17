const TopicAssignmentQuestion = `
  type TopicAssignmentQuestion
  {
   assignmentQuestion: AssignmentQuestion @relation(name: "AssignmentTopicAssignmentQuestion")
   order: Int
  }
`;

export default TopicAssignmentQuestion;

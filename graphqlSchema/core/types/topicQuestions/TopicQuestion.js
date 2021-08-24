const TopicQuestion = `
  type TopicQuestion
  {
   question: QuestionBank @relation(name: "QuestionTopicQuestion")
   order: Int
  }
`;

export default TopicQuestion;

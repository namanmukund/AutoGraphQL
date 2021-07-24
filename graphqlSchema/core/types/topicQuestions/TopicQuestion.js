const TopicQuestion = `
  type TopicQuestion
  {
   order: Int
   question: QuestionBank @relation(name: "QuestionTopicQuestion")
  }
`;

export default TopicQuestion;

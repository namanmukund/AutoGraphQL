const TopicQuestion = `
  type TopicQuestion @model
  {
   order: Int
   quiz: QuestionBank @relation(name: "QuizTopicQuestion")
  }
`;

export default TopicQuestion;

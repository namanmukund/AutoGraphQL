const QuestionBank = `
  type QuestionBank @model {
    order: Int!
    statement: String!
    explanation: String
    type: QuestionBankType! @defaultValue(value: "mcq")
    createdAt: Date @readOnly
    updatedAt: Date @readOnly
    options: [QuestionBankOption]
    learningObjectives: LearningObjective @relation(name: "LearningObjectiveQuestionBank")
    conceptCard: ConceptCard @relation(name: "ConceptCardPracticeQuestions")
    topic: Topic @relation(name: "QuestionBankTopic" isSubset: true)
    status: ContentStatus! @defaultValue(value: "unpublished")
  }
`;

export default QuestionBank;

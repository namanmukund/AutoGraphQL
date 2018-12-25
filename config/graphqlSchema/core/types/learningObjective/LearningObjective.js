const LearningObjective = `
  type LearningObjective @model {
    order: Int!
    title: String!
    createdAt: Date @readOnly
    updatedAt: Date @readOnly
    topic: Topic @relation(name: "LearningObjectiveTopic" isSubset: true)
    conceptCard: ConceptCard @relation(name: "LearningObjectiveConceptCards")
    questionBank: [QuestionBank] @relation(name: "LearningObjectiveQuestionBank")
    status: ContentStatus! @defaultValue(value: "unpublished")
  }
`;

export default LearningObjective;

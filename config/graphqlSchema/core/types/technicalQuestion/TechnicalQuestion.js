const TechnicalQuestion = `
  type TechnicalQuestion @model {
    order: Int!
    statement: String!
    explanation: String
    output: String!
    logicType: String
    logicText: String
    createdAt: Date @readOnly
    updatedAt: Date @readOnly
    conceptCard: ConceptCard @relation(name: "ConceptCardTechnicalQuestions" isSubset: true)
    status: ContentStatus! @defaultValue(value: "unpublished")
  }
`;

export default TechnicalQuestion;

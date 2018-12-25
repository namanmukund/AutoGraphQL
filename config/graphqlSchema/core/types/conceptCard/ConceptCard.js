const ConceptCard = `
  type ConceptCard @model {
    order: Int @unique @required
    title: String! @required
    description: String
    createdAt: Date @readOnly
    updatedAt: Date @readOnly
    topic: Topic @relation(name: "ConceptCardTopic" isSubset: true)
    learningObjective: LearningObjective @relation(name: "LearningObjectiveConceptCards")
    practiceQuestions: [QuestionBank] @relation(name: "ConceptCardPracticeQuestions")
    technicalQuestions: [TechnicalQuestion] @relation(name: "ConceptCardTechnicalQuestions")
    visuals: [Visual] @relation(name: "ConceptCardVisuals")
    status: ContentStatus! @defaultValue(value: "unpublished")
  }
`;

export default ConceptCard;

const QuestionBank = `
  type QuestionBank @model {
    order: Int!
    statement: String!
    hint: String
    questionType: QuestionBankType! @defaultValue(value: "mcq")
    difficulty: Int
    assessmentType: AssessmentType!
    layout: QuestionBankLayoutType
    layoutText: String
    createdAt: Date @readOnly
    updatedAt: Date @readOnly
    mcqOptions: [McqOption]
    fibBlocksOptions: [FibBlocksOption]
    fibInputOptions: [FibInputOption]
    arrangeOptions: [ArrangeOption]
    learningObjectiveQuestionBank: LearningObjective @relation(name: "LearningObjectiveQuestionBank")
    status: ContentStatus! @defaultValue(value: "unpublished")
  }
`;

export default QuestionBank;

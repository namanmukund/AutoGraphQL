const QuestionBank = `
  type QuestionBank @model {
    order: Int
    statement: String!
    hint: String
    questionType: QuestionBankType! @defaultValue(value: "mcq")
    difficulty: Int
    testType: TestType!
    layout: LayoutType
    layoutText: String
    createdAt: Date @readOnly
    updatedAt: Date @readOnly
    mcqOptions: [McqOption]
    fibBlocksOptions: [FibBlocksOption]
    fibInputOptions: [FibInputOption]
    arrangeOptions: [ArrangeOption]
    learningObjective: LearningObjective @relation(name: "LearningObjectivePracticeQuestion")
    topic: Topic @relation(name: "TopicQuiz" isSubset: true)
    status: ContentStatus! @defaultValue(value: "unpublished")
  }
`;

export default QuestionBank;

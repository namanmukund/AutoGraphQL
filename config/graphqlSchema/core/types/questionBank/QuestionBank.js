const QuestionBank = `
  type QuestionBank @model {
    order: Int!
    statement: String! @trim
    hint: String @trim
    questionType: QuestionBankType! @defaultValue(value: "mcq")
    difficulty: Int
    assessmentType: AssessmentType!
    codeSnippet: String @trim
    explanation: String @trim
    mcqOptions: [McqOption]
    fibBlocksOptions: [FibBlocksOption]
    fibInputOptions: [FibInputOption]
    arrangeOptions: [ArrangeOption]
    learningObjective: LearningObjective! @relation(name: "LearningObjectiveQuestionBank")
    topic: Topic! @relation(name: "TopicQuestionBank")
    status: ContentStatus! @defaultValue(value: "unpublished")
  }
`;

export default QuestionBank;

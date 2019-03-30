const QuestionBank = `
  type QuestionBank @model {
    order: Int!
    statement: String! @length(min: 6, max: 300) @trim
    hint: String @length(min: 6, max: 300) @trim
    questionType: QuestionBankType! @defaultValue(value: "mcq")
    difficulty: Int
    assessmentType: AssessmentType!
    layout: QuestionBankLayoutType
    layoutText: String @length(min: 6, max: 300) @trim
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

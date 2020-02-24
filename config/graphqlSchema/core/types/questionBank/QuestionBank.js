import { TLA, TMS } from '../../../../../constants';
import { READ } from '../../../../../constants/graphqlOperations';

const QuestionBank = `
  type QuestionBank @model 
  @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: "*" },
      { appName: "${TLA}" operations: ${READ} }], 
    rule: allow
  ) 
  {
    order: Int!
    statement: String! @trim
    hint: String @trim
    questionType: QuestionBankType! @defaultValue(value: "mcq")
    questionLayoutType: QuestionBankLayoutType! @defaultValue(value: "editor")
    difficulty: Int
    assessmentType: AssessmentType!
    questionCodeSnippet: String @trim
    answerCodeSnippet: String @trim
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

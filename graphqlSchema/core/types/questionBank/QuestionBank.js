import { READ } from '../../../../constants/graphqlOperations';
import { TLA, TMS, TWA } from '../../../../constants';
import { CMS_HEAD, NOT_CMS_HEAD } from '../../../../constants/roles';

const QuestionBank = `
  type QuestionBank @model 
  @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: "*" },
      { appName: "${TLA}" operations: ${READ} },
      { appName: "${TWA}" operations: ${READ} }
      ], 
    rule: allow
  ) 
  @userPermissions(
    permissions:[
      { userRole: ${CMS_HEAD} appName: "*" operations: "*" },
      { userRole: ${NOT_CMS_HEAD} appName: "*" operations: ${READ} }
      ], 
    rule: allow
  ) 
  {
    order: Int!
    statement: String! @trim
    hint: String @trim
    hints: [Hint]
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
    learningObjective: LearningObjective @relation(name: "OldLearningObjectiveQuestionBank",  direction: "OneWay")
    topic: Topic @relation(name: "OldQuestionTopicQuestion",  direction: "OneWay")
    learningObjectives: [LearningObjective] @relation(name: "LearningObjectiveQuestionBank")
    topics: [Topic] @relation(name: "QuestionTopicQuestion")
    status: ContentStatus! @defaultValue(value: "unpublished")
    courses: [Course] @relation(name: "CourseQuestionBank", direction: "OneWay")
    tags: [ContentTag] @relation(name: "ContentTagQuestionBank")
  }
`;

export default QuestionBank;

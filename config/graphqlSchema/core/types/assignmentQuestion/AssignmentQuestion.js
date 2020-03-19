import { READ } from '../../../../../constants/graphqlOperations';
import { TLA, TMS } from '../../../../../constants';
import { CMS_HEAD, NOT_CMS_HEAD } from '../../../../../constants/roles';

const AssignmentQuestion = `
  type AssignmentQuestion @model 
  @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: "*" },
      { appName: "${TLA}" operations: ${READ} }], 
    rule: allow
  ) 
  @userPermissions(
    permissions:[
      { userRole: ${CMS_HEAD} appName: "*" operations: "*" },
      { userRole: ${NOT_CMS_HEAD} appName: "*" operations: ${READ} }
      ], 
    rule: allow
  ){
    order: Int!
    statement: String! @trim
    hint: String @trim
    difficulty: Int
    questionCodeSnippet: String @trim
    explanation: String @trim
    topic: Topic! @relation(name: "TopicAssignmentQuestion")
    status: ContentStatus! @defaultValue(value: "unpublished")
  }
`;
export default AssignmentQuestion;

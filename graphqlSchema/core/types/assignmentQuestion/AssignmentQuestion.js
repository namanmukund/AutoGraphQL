import { READ } from '../../../../constants/graphqlOperations';
import { TLA, TMS, TWA } from '../../../../constants';
import { CMS_HEAD, NOT_CMS_HEAD } from '../../../../constants/roles';

const AssignmentQuestion = `
  type AssignmentQuestion @model 
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
  ){
    order: Int!
    statement: String! @trim
    hint: String @trim
    difficulty: Int
    isHomework: Boolean @defaultValue(value: "false")
    questionCodeSnippet: String @trim
    answerCodeSnippet: String @trim
    initialCode: String @trim
    explanation: String @trim
    topic: Topic @relation(name: "OldAssignmentTopicAssignmentQuestion",  direction: "OneWay")
    topics: [Topic] @relation(name: "AssignmentTopicAssignmentQuestion")
    status: ContentStatus! @defaultValue(value: "unpublished")
    courses: [Course] @relation(name: "CourseAssignmentQuestion", direction: "OneWay")
  }
`;
export default AssignmentQuestion;

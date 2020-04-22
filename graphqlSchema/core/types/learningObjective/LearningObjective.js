import { READ } from '../../../../constants/graphqlOperations';
import { TLA, TMS } from '../../../../constants';
import { CMS_HEAD, NOT_CMS_HEAD } from '../../../../constants/roles';

const LearningObjective = `
  type LearningObjective @model
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
  ) 
  {
    order: Int!
    title: String! @unique @trim
    description: String @uniqueOrEmpty @unique @trim
    pqStory: String @trim
    pqStoryImage: File @relation(name: "LearningObjectivePqStoryImage", direction: "OneWay")
    videoStartTime: Int
    videoEndTime: Int
    videoThumbnail: File @relation(name: "LearningObjectiveVideoThumbnail", direction: "OneWay")
    topic: Topic @relation(name: "TopicLearningObjective")
    messages: [Message] @relation(name: "LearningObjectiveMessage", isSubset: true)
    questionBank: [QuestionBank] @relation(name: "LearningObjectiveQuestionBank", isSubset: true)
    status: ContentStatus! @defaultValue(value: "unpublished")
    thumbnail: File @relation(name: "LearningObjectiveThumbnail", direction: "OneWay")
    messageStatus: ContentStatus! @defaultValue(value: "unpublished")
  }
`;

export default LearningObjective;

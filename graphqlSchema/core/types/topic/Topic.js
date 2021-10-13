import { READ } from '../../../../constants/graphqlOperations';
import { TLA, TMS, TWA } from '../../../../constants';
import {
  AUDIT_ROLES, CMS_HEAD, NOT_CMS_HEAD, SCHOOL_ADMIN,
} from '../../../../constants/roles';
import { CREATED } from '../../../../constants/subscriptionEvents';

const TopicComponentsRule = `
  type TopicComponentsRule {
   componentName: TopicComponents
   childComponentName: ChildTopicComponents
   order: Int
   learningObjective: LearningObjective @relation(name: "TopicComponentLearningObjective", direction: "OneWay")
   video: Video @relation(name: "TopicComponentVideo", direction: "OneWay")
   blockBasedProject: BlockBasedProject @relation(name: "TopicComponentBlockBasedProject", direction: "OneWay")
 }`;

const Topic = `
  type Topic @model
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
      { userRole: ${NOT_CMS_HEAD} appName: "*" operations: ${READ} },
      { userRole: ${SCHOOL_ADMIN} appName: "*" operations: ${READ} },
      { userRole: ${AUDIT_ROLES} appName: "*" operations: ${READ} },
      ], 
    rule: allow
  ) 
  @subscribe(events: [${CREATED}])
  {
    order: Int! 
    title: String!
        @trim
    description: String @trim
    status: ContentStatus! @defaultValue(value: "unpublished")
    video: File @relation(name: "TopicVideo", direction: "OneWay")
    videoTitle: String @uniqueOrEmpty @trim
    videoDescription: String @uniqueOrEmpty @trim
    videoSubtitle: File @relation(name: "TopicVideoSubtitle", direction: "OneWay")
    videoThumbnail: File @relation(name: "TopicVideoThumbnail", direction: "OneWay")
    videoStatus: ContentStatus! @defaultValue(value: "unpublished")
    videoStartTime: Int
    isQuestionInMessageEnabled: Boolean @defaultValue(value: "false")
    videoEndTime: Int
    storyStartTime: Int
    storyEndTime: Int
    storyThumbnail: File @relation(name: "StoryThumbnail", direction: "OneWay")
    chapter: Chapter @relation(name: "ChapterTopic")
    learningObjectives: [LearningObjective] @relation(name: "TopicLearningObjective")
    questions: [QuestionBank] @relation(name: "OldTopicQuestionBank", direction: "OneWay")
    topicQuestions: [TopicQuestion]
    topicAssignmentQuestions: [TopicAssignmentQuestion]
    topicHomeworkAssignmentQuestion: [TopicAssignmentQuestion]
    badges: [Badge] @relation(name: "TopicBadge", isSubset: true)
    thumbnail: File @relation(name: "TopicThumbnail", direction: "OneWay")
    thumbnailSmall: File @relation(name: "TopicThumbnailSmall", direction: "OneWay")
    isTrial: Boolean @defaultValue(value: "false")
    assignmentQuestions: [AssignmentQuestion] @relation(name: "OldTopicAssignmentQuestion", direction: "OneWay")
    bulletPoints: [BulletPoint]
    courses: [Course] @relation(name: "CourseTopic")
    blockBasedProjects: [BlockBasedProject] @relation(name: "TopicBlockBasedProject")
    videoContent: [Video] @relation(name: "TopicVideoContent")
    topicComponentRule: [TopicComponentsRule]
  }
`;

export default [Topic, TopicComponentsRule];

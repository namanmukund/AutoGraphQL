import { READ } from '../../../../constants/graphqlOperations';
import { TLA, TMS, TWA } from '../../../../constants';
import { CMS_HEAD, NOT_CMS_HEAD } from '../../../../constants/roles';
import { CREATED } from '../../../../constants/subscriptionEvents';

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
      { userRole: ${NOT_CMS_HEAD} appName: "*" operations: ${READ} }
      ], 
    rule: allow
  ) 
  @subscribe(events: [${CREATED}])
  {
    order: Int! 
    title: String! 
        @unique 
        @trim
    description: String @uniqueOrEmpty @trim
    status: ContentStatus! @defaultValue(value: "unpublished")
    video: File @relation(name: "TopicVideo", direction: "OneWay")
    videoTitle: String @uniqueOrEmpty @trim
    videoDescription: String @uniqueOrEmpty @trim
    videoSubtitle: File @relation(name: "VideoSubtitle", direction: "OneWay")
    videoThumbnail: File @relation(name: "VideoThumbnail", direction: "OneWay")
    videoStatus: ContentStatus! @defaultValue(value: "unpublished")
    videoStartTime: Int
    videoEndTime: Int
    storyStartTime: Int
    storyEndTime: Int
    storyThumbnail: File @relation(name: "StoryThumbnail", direction: "OneWay")
    chapter: Chapter @relation(name: "ChapterTopic")
    learningObjectives: [LearningObjective] @relation(name: "TopicLearningObjective", isSubset: true)
    questions: [QuestionBank] @relation(name: "TopicQuestionBank")
    badges: [Badge] @relation(name: "TopicBadge", isSubset: true)
    thumbnail: File @relation(name: "TopicThumbnail", direction: "OneWay")
    thumbnailSmall: File @relation(name: "TopicThumbnailSmall", direction: "OneWay")
    isTrial: Boolean @defaultValue(value: "false")
    assignmentQuestions: [AssignmentQuestion] @relation(name: "TopicAssignmentQuestion")
  }
`;

export default Topic;

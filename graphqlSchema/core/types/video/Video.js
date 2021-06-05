import { READ } from '../../../../constants/graphqlOperations';
import { TLA, TMS, TWA } from '../../../../constants';
import { CMS_HEAD, NOT_CMS_HEAD, SCHOOL_ADMIN } from '../../../../constants/roles';
import { CREATED } from '../../../../constants/subscriptionEvents';

const Video = `
  type Video @model
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
      { userRole: ${SCHOOL_ADMIN} appName: "*" operations: ${READ} }
      ], 
    rule: allow
  ) 
  @subscribe(events: [${CREATED}])
  {
    status: ContentStatus! @defaultValue(value: "unpublished")
    videoFile: File @relation(name: "VideoFile", direction: "OneWay")
    title: String @uniqueOrEmpty @trim
    description: String @uniqueOrEmpty @trim
    subtitle: File @relation(name: "VideoSubtitle", direction: "OneWay")
    thumbnail: File @relation(name: "VideoThumbnail", direction: "OneWay")
    videoStartTime: Int
    videoEndTime: Int
    storyStartTime: Int
    storyEndTime: Int
    storyThumbnail: File @relation(name: "StoryThumbnail", direction: "OneWay")
    topics: [Topic] @relation(name: "TopicVideo")
  }
`;

export default Video;

const VideoWatchTimeType = `
  type VideoWatchTimeType {
   videoStartTime: Int
   videoEndTime: Int
 }`;

const LearningObjectiveInVideoType = `
  type LearningObjectiveInVideoType {
   learningObjective: LearningObjective @relation(name: "LearningObjectiveUserActivityVideoDump", direction: "OneWay")
   loHitCount: Int
 }`;

const VideoShareType = `
  type VideoShareType {
   shareMedium: String
   shareCount: Int
 }`;

const UserActivityVideoDump = `
  type UserActivityVideoDump @model {
    user: User @relation(name: "UserActivityVideoDump", direction: "OneWay")
    videoCurrentTime: Int
    isBookmarked: Boolean @defaultValue(value: "false")
    isShared: Boolean @defaultValue(value: "false")
    videoShare: [VideoShareType]
    bookmarkCount: Int
    isLiked: Boolean @defaultValue(value: "false")
    videoAction: UserActionType
    videoWatchTime: [VideoWatchTimeType]
    maxMinVideoCollapseTime: Int
    playPauseCount: Int
    isCaptionUsed: Boolean
    captionCount: Int
    likeCount: Int
    topic: Topic @relation(name: "TopicUserActivityVideoDump", direction: "OneWay")
    learningObjectiveInVideo: [LearningObjectiveInVideoType]
    storyHitCount: Int
  }
`;

export default [UserActivityVideoDump, VideoWatchTimeType, LearningObjectiveInVideoType,
  VideoShareType];

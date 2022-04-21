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
    user: User! @relation(name: "UserActivityVideoDump", direction: "OneWay")
    videoCurrentTime: Int
    isBookmarked: Boolean
    isShared: Boolean
    videoShare: [VideoShareType]
    bookmarkCount: Int
    isLiked: Boolean
    videoAction: UserActionType!
    videoWatchTime: [VideoWatchTimeType]
    maxMinVideoCollapseTime: Int
    playPauseCount: Int
    isCaptionUsed: Boolean
    captionCount: Int
    likeCount: Int
    topic: Topic! @relation(name: "TopicUserActivityVideoDump", direction: "OneWay")
    learningObjectiveInVideo: [LearningObjectiveInVideoType]
    storyHitCount: Int
    video: Video @relation(name: "VideoUserActivityVideoDump", direction: "OneWay")
    course: Course @relation(name: "UserActivityVideoDumpCourse", direction: "OneWay")
    startTime:Date
    endTime: Date
  }
`;

export default [UserActivityVideoDump, VideoWatchTimeType, LearningObjectiveInVideoType,
  VideoShareType];

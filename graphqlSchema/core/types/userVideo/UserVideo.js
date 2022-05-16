const userVideoNextComponentType = `
  type UserVideoNextComponentType {
   learningObjective: LearningObjective @relation(name: "UserVideoLearningObjective", direction: "OneWay")
   nextComponentType: CurrentTopicComponentType
   topic: Topic @relation(name: "UserVideoNextComponentTypeTopic", direction: "OneWay")
   video: Video @relation(name: "UserVideoNextComponentTypeVideo", direction: "OneWay")
 }`;

const UserVideo = `
  type UserVideo @model @databaseController(mode: "aggregation") {
    user: User! @relation(name: "UserVideo", direction: "OneWay")
    topic: Topic! @relation(name: "UserVideoTopic", direction: "OneWay")
    course: Course @relation(name: "UserVideoCourse", direction: "OneWay")
    video: Video @relation(name: "VideoUserVideo", direction: "OneWay")
    isLiked: Boolean @defaultValue(value: "false")
    isBookmarked: Boolean @defaultValue(value: "false")
    videoCurrentTime: Int @defaultValue(value: "0")
    status: UserTopicTypeStatus @defaultValue(value: "incomplete")
    nextComponent: UserVideoNextComponentType
    activityStartTime: Date
    activityEndTime: Date
  }
`;

export default [UserVideo, userVideoNextComponentType];

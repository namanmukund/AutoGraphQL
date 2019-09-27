const userVideoNextComponentType = `
  type UserVideoNextComponentType {
   learningObjective: LearningObjective @relation(name: "UserVideoLearningObjective", direction: "OneWay")
   nextComponentType: CurrentTopicComponentType
 }`;

const UserVideo = `
  type UserVideo @model {
    user: User! @relation(name: "UserVideo", direction: "OneWay")
    topic: Topic! @relation(name: "UserVideoTopic", direction: "OneWay")
    isLiked: Boolean @defaultValue(value: "false")
    isBookmarked: Boolean @defaultValue(value: "false")
    videoCurrentTime: Int @defaultValue(value: "0")
    status: UserTopicTypeStatus @defaultValue(value: "incomplete")
    nextComponent: UserVideoNextComponentType
    isSkipped: Boolean @defaultValue(value: "false")
  }
`;

export default [UserVideo, userVideoNextComponentType];

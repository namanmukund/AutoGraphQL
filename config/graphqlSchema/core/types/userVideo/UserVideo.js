const UserVideo = `
  type UserVideo @model {
    user: User! @relation(name: "UserVideo", direction: "OneWay")
    topic: Topic @relation(name: "UserVideoTopic", direction: "OneWay")
    isLiked: Boolean @defaultValue(value: "false")
    isBookmarked: Boolean @defaultValue(value: "false")
    videoCurrentTime: Int
    status: UserComponentStatus
  }
`;

export default UserVideo;

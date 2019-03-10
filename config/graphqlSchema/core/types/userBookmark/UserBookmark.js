const bookmarkVideoType = `
  type BookmarkVideoType {
   topic: Topic @relation(name: "TopicUserBookmark", direction: "OneWay")
   order: Int
 }`;

const bookmarkChatType = `
  type BookmarkChatType {
   learningObjective: LearningObjective @relation(name: "LearningObjectiveUserBookmark", direction: "OneWay")
   order: Int
 }`;

const UserBookmark = `
  type UserBookmark @model {
    user: User! @relation(name: "UserActivityQuizDump", direction: "OneWay")
    videos: [BookmarkVideoType]
    chat: [BookmarkChatType]
  }
`;

export default [UserBookmark, bookmarkChatType, bookmarkVideoType];

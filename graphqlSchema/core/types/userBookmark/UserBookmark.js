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

const practiceQuestionType = `
  type PracticeQuestionType {
   learningObjective: LearningObjective @relation(name: "LearningObjectiveUserBookmark", direction: "OneWay")
   order: Int
 }`;

const UserBookmark = `
  type UserBookmark @model {
    user: User! @relation(name: "UserBookmark", direction: "OneWay")
    videos: [BookmarkVideoType]
    chat: [BookmarkChatType]
    practiceQuestion: [PracticeQuestionType]
    cheatsheet: [CheatSheet] @relation(name: "CheatSheetBookmark", direction: "OneWay")
  }
`;

export default [UserBookmark, bookmarkChatType, bookmarkVideoType, practiceQuestionType];

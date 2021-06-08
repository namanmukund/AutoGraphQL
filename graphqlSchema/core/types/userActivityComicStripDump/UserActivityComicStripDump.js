const ComicStripShareType = `
  type ComicStripShareType {
   shareMedium: String
   shareCount: Int
 }`;

const UserActivityComicStripDump = `
  type UserActivityComicStripDump @model {
    user: User! @relation(name: "UserActivityComicStripDump", direction: "OneWay")
    isBookmarked: Boolean
    isShared: Boolean
    comicStripShares: [ComicStripShareType]
    bookmarkCount: Int
    currentComicImage: File @relation(name: "ComicImageUserActivityComicStripDump", direction: "OneWay")
    comicStripAction: UserActionType
    learningObjective: LearningObjective! @relation(name: "LearningObjectiveUserActivityComicStripDump", direction: "OneWay")
    topic: Topic @relation(name: "TopicUserActivityComicStripDump", direction: "OneWay")
  }
`;

export default [UserActivityComicStripDump, ComicStripShareType];

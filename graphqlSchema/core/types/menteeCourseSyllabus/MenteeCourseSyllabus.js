const sessionDetailType = `
  type SessionDetailType {
   topicId: ID
   topicTitle: String
   topicThumbnail: File
   topicThumbnailSmall: File
   topicDescription: String
   topicOrder: Int
   bookingDate: Date
   slotTime: Int
   isAccessible: Boolean
 }`;

const completedSessionDetailType = `
  type CompletedSessionDetailType {
   topicId: ID
   topicTitle: String
   topicThumbnail: File
   topicThumbnailSmall: File
   topicDescription: String
   topicOrder: Int
   endingDate: Date
 }`;

const MenteeCourseSyllabus = `
  type MenteeCourseSyllabus {
    upComingSession: [SessionDetailType]
    bookedSession: [SessionDetailType]
    completedSession: [CompletedSessionDetailType]
    totalChapters: Int
    totalTopics: Int
    isPaid: Boolean @defaultValue(value: "false")
  }
`;

export default [MenteeCourseSyllabus, sessionDetailType, completedSessionDetailType];

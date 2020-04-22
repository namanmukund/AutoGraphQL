const sessionDetailType = `
  type SessionDetailType {
   topicId: ID
   topicTitle: String
   topicThumbnail: File
   topicDescription: String
   topicOrder: Int
   bookingDate: Date
   slotTime: Int
   mentorId: ID
   mentorName: String
   mentorProfilePic: String
 }`;

const MenteeCourseSyllabus = `
  type MenteeCourseSyllabus {
    upComingSession: [SessionDetailType]
    bookedSession: [SessionDetailType]
    totalChapters: Int
    totalTopics: Int
  }
`;

export default [MenteeCourseSyllabus, sessionDetailType];

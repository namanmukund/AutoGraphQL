import getSlotTimeFields from '../../functions/getSlotTimeFields';

const slotTimeFields = getSlotTimeFields('Boolean', false);

const NextOrPrevClassroomSession = `
  type NextOrPrevClassroomSession {
    id: String!
    topicTitle: String
    topicOrder: Int
    topicComponentRule: [TopicComponentsRule]
    classType: ClassType @defaultValue(value: "lab")
    bookingDate: Date
    ${slotTimeFields}
    startMinutes: Int @defaultValue(value: "0")
    endMinutes: Int @defaultValue(value: "0")
    totalStudents: Int
    isHomeworkExists: Boolean @default(value: "false")
    isQuizExists: Boolean @default(value: "false")
    completedHomeworkMeta: String
    completedQuizMeta: String
    thumbnailSmall: File
    recordType: ClassroomSessionDocumentType @defaultValue(value: "batchSession")
    sessionMode: SessionMode @defaultValue(value: "online")
    sessionStartDate: Date
    sessionEndDate: Date
    sessionStatus: SessionStatus! @defaultValue(value: "allotted")
    sessionRecordingLink: String
  }
`;

const NextOrPrevClassroomSessionResult = `
  type NextOrPrevClassroomSessionResult {
    classroomId: ID!
    limit: Int!
    queryType: NextOrPrevSessionType!
    documentType: SessionDocumentType! @defaultValue(value: "batch")
    sessions: [NextOrPrevClassroomSession]!
  }
`;

export default [NextOrPrevClassroomSessionResult, NextOrPrevClassroomSession];

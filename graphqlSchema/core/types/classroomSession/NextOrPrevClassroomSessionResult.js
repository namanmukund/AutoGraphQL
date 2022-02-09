import getSlotTimeFields from '../../functions/getSlotTimeFields';

const slotTimeFields = getSlotTimeFields('Boolean', false);

const NextOrPrevClassroomSessionResult = `
  type NextOrPrevClassroomSessionResult {
    id: String!
    topicTitle: String
    topicOrder: Int
    bookingDate: Date
    ${slotTimeFields}
    totalStudents: Int
    completedHomeworkMeta: Int
    thumbnailSmall: File
    documentType: ClassroomSessionDocumentType @defaultValue(value: "batchSession")
    sessionMode: SessionMode @defaultValue(value: "online")
    sessionStartDate: Date
    sessionEndDate: Date
    sessionStatus: SessionStatus! @defaultValue(value: "allotted")
    sessionRecordingLink: String
  }
`;

export default [NextOrPrevClassroomSessionResult];

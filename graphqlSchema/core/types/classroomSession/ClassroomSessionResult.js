import getSlotTimeFields from "../../functions/getSlotTimeFields";

const slotTimeFields = getSlotTimeFields("Boolean", false);

const ClassroomSessionType = `
  enum ClassroomSessionType {
    learning
    revision
    homework
    assessment
    project
  }
`;

const ClassroomSessionTopic = `
  type ClassroomSessionTopic {
    id: ID
    order: Int! 
    title: String! @trim
    description: String @trim
    thumbnailSmallUri: String
  }
`;

const ClassroomDetails = `
  type ClassroomDetails {
    code: String! @uniqueOrEmpty @trim @uppercase
    classroomTitle: String!
    description: String
    school: School @relation(name: "ClassroomSchool", direction: "OneWay")
  }
`;
  
const ClassroomSessionResult = `
  type ClassroomSessionResult {
    id: String
    bookingDate: Date!
    ${slotTimeFields}
    sessionStartDate: Date
    sessionEndDate: Date
    sessionStatus: SessionStatus! @defaultValue(value: "allotted")
    sessionMode: SessionMode @defaultValue(value: "online")
    sessionRecordingLink: String
    sessionType: ClassroomSessionType @defaultValue(value: "learning")
    documentType: SessionDocumentType @defaultValue(value: "batch")
    attendance: [BatchAttendanceType]
    classroom: ClassroomDetails
    previousTopic: Topic @relation(name: "ClassroomSessionTopic", direction: "OneWay")
  }
`;

export default [
  ClassroomSessionResult,
  ClassroomSessionTopic,
  ClassroomSessionType,
  ClassroomDetails,
];

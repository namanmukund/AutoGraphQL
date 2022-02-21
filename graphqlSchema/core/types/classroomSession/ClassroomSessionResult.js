import getSlotTimeFields from '../../functions/getSlotTimeFields';

const slotTimeFields = getSlotTimeFields('Boolean', false);

const ClassroomSessionType = `
  enum ClassroomSessionType {
    learning
    revision
    homework
    assessment
    project
  }
`;

const ClassroomSessionDocumentType = `
  enum ClassroomSessionDocumentType {
    batchSession
    adhocSession
    notYetBooked
    event
  }
`;

const ClassroomSessionTopic = `
  type ClassroomSessionTopic {
    id: ID
    order: Int! 
    title: String! @trim
    description: String @trim
    thumbnailSmall: File
    topicComponentRule: [TopicComponentsRule]
    topicAssignmentQuestionsCount: Int
    questionsQuizCount: Int
  }
`;

const ClassroomDetails = `
  type ClassroomDetails {
    id: ID!
    code: String! @uniqueOrEmpty @trim @uppercase
    classroomTitle: String!
    description: String
    classes: [SchoolClass] @relation(name: "ClassroomSchoolClass", direction: "OneWay")
    school: School @relation(name: "ClassroomSchool", direction: "OneWay")
    students: [StudentProfile] @relation(name: "ClassroomStudentProfile", direction: "OneWay")
  }
`;

const SessionOtpResult = `
type SessionOtpResult {
    grade: Grade
    section: Section
    otp: Int
  }`;

const ClassroomSessionResult = `
  type ClassroomSessionResult {
    id: String!
    bookingDate: Date
    ${slotTimeFields}
    startMinutes: Int @defaultValue(value: "0")
    endMinutes: Int @defaultValue(value: "0")
    sessionStartDate: Date
    sessionEndDate: Date
    sessionStatus: SessionStatus @defaultValue(value: "allotted")
    sessionMode: SessionMode @defaultValue(value: "online")
    sessionRecordingLink: String
    sessionType: ClassroomSessionType @defaultValue(value: "learning")
    eventType: TimetableScheduleEventType
    documentType: ClassroomSessionDocumentType @defaultValue(value: "batchSession")
    attendance: [BatchAttendanceType]
    classroom: ClassroomDetails
    topic: ClassroomSessionTopic
    previousTopic: ClassroomSessionTopic
    sessionOtp: [SessionOtpResult]
  }
`;

export default [
  ClassroomSessionDocumentType,
  ClassroomSessionResult,
  ClassroomSessionTopic,
  ClassroomSessionType,
  ClassroomDetails,
  SessionOtpResult,
];

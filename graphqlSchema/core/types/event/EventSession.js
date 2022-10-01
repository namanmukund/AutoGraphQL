import getSlotTimeFields from '../../functions/getSlotTimeFields';

const slotTimeFields = getSlotTimeFields('Boolean', false);

const eventAttendanceType = `
  type EventAttendanceType {
   student: StudentProfile! @relation(name:"EventSessionStudentProfile", direction: "OneWay")
   isPresent:  Boolean @defaultValue(value: "false")
   status: AttendanceStatus @defaultValue(value: "notAssigned")
 }`;

const EventSession = `
    type EventSession @model {
        event: Event! @relation(name: "EventSessionEvent")
        sessionDate: Date
        sessionLink: String
        meetingId: String
        meetingPassword: String
        attendance: [EventAttendanceType]
        ${slotTimeFields}
    }
`;

export default [EventSession, eventAttendanceType];

const eventAttendanceType = `
  type EventAttendanceType {
   student: StudentProfile! @relation(name:"EventSessionStudentProfile", direction: "OneWay")
   isPresent: Boolean
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
    }
`;

export default [EventSession, eventAttendanceType];

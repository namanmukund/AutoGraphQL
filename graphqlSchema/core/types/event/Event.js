const EventAttendance = `
type EventAttendance @model {
  user: User! @relation(name:"EventAttendanceUser")
  studentProfile: StudentProfile @relation(name:"EventAttendanceStudentProfile")
  attendance: AttendanceStatus @defaultValue(value: "absent")
  event: Event @relation(name:"EventAttendanceEvent")
}`;

const Event = `
  type Event @model
  {
    eventType: EventType @defaultValue(value: "radioStreet")
    name: String @trim
    date: Date
    time: Int
    eventAttendances: [EventAttendance] @relation(name:"EventAttendanceEvent")
  }
`;

export default [Event, EventAttendance];

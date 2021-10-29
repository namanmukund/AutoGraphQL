const Event = `
  type Event @model
  {
    eventType: EventType @defaultValue(value: "radioStreet")
    name: String @trim
    date: Date!
    time: Int
    status: AttendanceStatus @defaultValue(value: "absent")
    user: User! @relation(name:"UserEvent")
    studentProfile: StudentProfile @relation(name:"StudentProfileEvent")
  }
`;

export default [Event];

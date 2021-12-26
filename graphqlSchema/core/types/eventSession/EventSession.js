const EventSession = `
    type EventSession @model {
        event: Event! @relation(name: "EventSessionEvent", direction: "OneWay")
        sessionDate: Date
        sessionLink: String
        meetingId: String
        meetingPassword: String
        attendance: [StudentProfile] @relation(name:"EventAttendanceStudentProfile")
    }
`;

export default EventSession;

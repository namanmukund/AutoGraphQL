const EventAttendance = `
type EventAttendance @model {
  user: User! @relation(name:"EventAttendanceUser")
  studentProfile: StudentProfile @relation(name:"EventAttendanceStudentProfile")
  attendance: AttendanceStatus @defaultValue(value: "absent")
  event: Event @relation(name:"EventAttendanceEvent")
}`;
const EventCertificateEmbed = `
  type EventCertificateEmbed {
    image: File @relation(name: "EventCertificateEmbedFile")
    xDim: Int
    yDim: Int
    text: String
  }
`;
const EventTimeTableRule = `
  type EventTimeTableRule {
   startDate: Date
   endDate: Date
   ${weekDaysFields}
 }`;
const EventPrize = `
  type EventPrize {
   startDate: Date
   endDate: Date
   ${weekDaysFields}
 }`;

const Event = `
  type Event @model
  {
    eventType: EventType @defaultValue(value: "radioStreet")
    eventName: EventName @defaultValue(value: "spySquadCamp")
    name: String @trim
    speakers: [EventSpeaker] @relation(name:"EventEventSpeaker")
    date: Date
    time: Int
    eventAttendances: [EventAttendance] @relation(name:"EventAttendanceEvent")
    address: String
    city: String
    state: String
    pincode: Int
    startTime: Date
    endTime: Date
    timeZone: Date
    summary: String
    overview: String
    utmSource: String
    utmCampaign: String
    utmContent: String
    utmMedium: String
    utmTerm: String
    webUtl: String
    isListedOnWeb: Boolean
    status: ContentStatus
    embeds: [EventCertificateEmbed]
    timeTableRule: EventTimeTableRules
    prizes: [EventPrize]
  }
`;

export default [Event, EventAttendance, EventCertificateEmbed, EventTimeTableRule, EventPrize];

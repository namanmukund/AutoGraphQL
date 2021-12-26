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

const UTM = `
  type UTM {
    utmSource: String
    utmCampaign: String
    utmContent: String
    utmMedium: String
    utmTerm: String
 }`;

const Event = `
  type Event @model
  {
    eventType: EventType @defaultValue(value: "radioStreet")
    eventName: EventName @defaultValue(value: "spySquadCamp")
    geoLocation: String
    name: String @trim
    category: EventCategory @relation(name: "EventCategoryEvent")
    speakers: [EventSpeaker] @relation(name: "EventSpeakerEvent")
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
    utm: [UTM]
    webUrl: String
    isListedOnWeb: Boolean
    status: ContentStatus
    embeds: [EventCertificateEmbed]
    timeTableRule: EventTimeTableRules
    prizes: EventPrize @relation(name: "EventPrizeEvent")
    tags: [ContentTag] @relation(name: "ContentTagEvent")
    registeredUsers: [StudentProfile] @relation(name:"EventAttendanceStudentProfile")
  }
`;

export default [Event, EventAttendance, EventCertificateEmbed, EventTimeTableRule, UTM];

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
const UTMParameters = `
  type UTMParameters {
    utmSource: String
    utmCampaign: String
    utmContent: String
    utmMedium: String
    utmTerm: String
    webUrl: String
 }`;

const Event = `
  type Event @model
  {
    eventType: EventType @defaultValue(value: "radioStreet")
    eventName: EventName @defaultValue(value: "spySquadCamp")
    type: EventTypes
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
    utm: [UTMParameters]
    isListedOnWeb: Boolean
    status: ContentStatus
    embeds: [EventCertificateEmbed]
    eventTimeTableRule: BatchTimeTableRule
    prizes: [EventPrize] @relation(name: "EventPrizeEvent")
    tags: [ContentTag] @relation(name: "ContentTagEvent")
    registeredUsers: [StudentProfile] @relation(name:"EventAttendanceStudentProfile", direction: "OneWay")
    whatsAppVariable: [WhatsAppVariable] @relation(name: "WhatsAppVariableEvent")
  }
`;

export default [Event, EventAttendance, EventCertificateEmbed, UTMParameters];

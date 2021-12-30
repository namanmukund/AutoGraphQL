const EventAttendance = `
type EventAttendance @model {
  user: User! @relation(name:"EventAttendanceUser")
  studentProfile: StudentProfile @relation(name:"EventAttendanceStudentProfile")
  attendance: AttendanceStatus @defaultValue(value: "absent")
  event: Event @relation(name:"EventAttendanceEvent")
}`;
const EventCertificate = `
  type EventCertificate @model{
    image: File @relation(name: "EventCertificateFile", direction: "OneWay")
    xDim: Int
    yDim: Int
    text: String
    textSize: Int
    fontFamily: String
    variableName: String
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
    organizer: EventOrganizer
    locationType: LocationType
    category: EventCategory @relation(name: "EventCategoryEvent")
    speakers: [EventSpeakerProfile] @relation(name: "EventSpeakerProfileEvent")
    date: Date
    time: Date
    eventJoinReasons: [EventJoinReason] @relation(name: "EventJoinReasonEvent")
    eventAttendances: [EventAttendance] @relation(name:"EventAttendanceEvent")
    address: String
    city: String
    state: String
    pincode: Int
    startTime: Date
    endTime: Date
    timeZone: String
    summary: String
    overview: String
    utm: [UTMParameters]
    isListedOnWeb: Boolean
    status: ContentStatus
    embeds: [EventCertificate] @relation(name: "EventCertificateEvent", direction: "OneWay")
    eventTimeTableRule: BatchTimeTableRule
    prizes: [EventPrize] @relation(name: "EventPrizeEvent")
    tags: [ContentTag] @relation(name: "ContentTagEvent")
    registeredUsers: [StudentProfile] @relation(name:"EventRegisteredStudentProfile", direction: "OneWay")
    whatsAppVariables: [WhatsAppCommsVariable] @relation(name: "WhatsAppCommsVariableEvent")
    isSchoolEvent: Boolean
    eventBanner: File @relation(name: "EventBannerEvent", direction: "OneWay")
    listingImage: File @relation(name: "ListingImageEvent", direction: "OneWay")
    schools: [School] @relation(name: "EventSchool", direction: "OneWay")
    eventSessions: [EventSession] @relation(name: "EventSessionEvent")
  }
`;

export default [Event, EventAttendance, EventCertificate, UTMParameters];

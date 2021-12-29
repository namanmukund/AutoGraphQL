const EventAttendance = `
type EventAttendance @model {
  user: User! @relation(name:"EventAttendanceUser")
  studentProfile: StudentProfile @relation(name:"EventAttendanceStudentProfile")
  attendance: AttendanceStatus @defaultValue(value: "absent")
  event: Event @relation(name:"EventAttendanceEvent")
}`;
const EventCertificateEmbed = `
  type EventCertificateEmbed @model{
    image: File @relation(name: "EventCertificateEmbedFile", direction: "OneWay")
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
    embeds: [EventCertificateEmbed] @relation(name: "EventCertificateEmbedEvent", direction: "OneWay")
    eventTimeTableRule: BatchTimeTableRule
    prizes: [EventPrize] @relation(name: "EventPrizeEvent")
    tags: [ContentTag] @relation(name: "ContentTagEvent")
    registeredUsers: [StudentProfile] @relation(name:"EventRegisteredStudentProfile", direction: "OneWay")
    whatsAppVariables: [WhatsAppVariable] @relation(name: "WhatsAppVariableEvent")
    isSchoolEvent: Boolean
    eventBanner: File @relation(name: "EventBannerEvent", direction: "OneWay")
    listingImage: File @relation(name: "ListingImageEvent", direction: "OneWay")
    schools: [School] @relation(name: "EventSchool", direction: "OneWay")
  }
`;

export default [Event, EventAttendance, EventCertificateEmbed, UTMParameters];

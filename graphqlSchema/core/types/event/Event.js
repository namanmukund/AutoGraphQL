import {
  TBA, TLA, TMS, TWA,
} from '../../../../constants';

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
    variableName: CommsDataField
    red: Int @length(min: 0, max: 255)
    green: Int @length(min: 0, max: 255)
    blue: Int @length(min: 0, max: 255)
    rotate: Int @length(min: -359, max: 359)
  }
`;

const CommsVariableType = `
 type CommsVariableType{
  whatsappVariableName: String
  emailVariableName: String
  dataField: CommsDataField
 }
`;

const EventCommsRule = `
 type EventCommsRule {
  templateName: String!
  commsVariables: [CommsVariableType]
  condition: DateCondition
  attendanceFilter: AttendanceFilter
  unit: DurationType
  value: Int
  isTested: Boolean
  isPassed: Boolean
  isSend: Boolean @defaultValue(value: "false")
  isEmailRule: Boolean @defaultValue(value: "false")
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
  @userToken(isRequired:"false") 
  @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: "*" }, 
      { appName: "${TBA}" operations: "*" }, 
      { appName: "${TLA}" operations: "*" },
      { appName: "${TWA}" operations: "*" },
      ], 
    rule: allow
  )
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
    dateType: EventTypes
    eventJoinReasons: [EventJoinReason] @relation(name: "EventJoinReasonEvent")
    eventAttendances: [EventAttendance] @relation(name:"EventAttendanceEvent")
    address: String
    city: String
    state: String
    pincode: Int
    timeZone: String
    sessionLink: String
    meetingId: String
    meetingPassword: String
    summary: String
    overview: String
    utm: [UTMParameters]
    isListedOnWeb: Boolean
    status: ContentStatus @defaultValue(value: "unpublished")
    sessionCreationStatus: BatchCreationStatus
    embeds: [EventCertificateEmbed] @relation(name: "EventCertificateEmbedEvent", direction: "OneWay")
    baseCertificate: File @relation(name: "BaseCertificateEvent", direction: "OneWay")
    eventTimeTableRule: BatchTimeTableRule
    eventCommsRule: [EventCommsRule]
    prizes: [EventPrize] @relation(name: "EventPrizeEvent")
    tags: [ContentTag] @relation(name: "ContentTagEvent")
    registeredUsers: [StudentProfile] @relation(name:"EventStudentProfile")
    commsVariables: [CommsVariable] @relation(name: "CommsVariableEvent")
    isSchoolEvent: Boolean
    eventBanner: File @relation(name: "EventBannerEvent", direction: "OneWay")
    listingImage: File @relation(name: "ListingImageEvent", direction: "OneWay")
    schools: [School] @relation(name: "EventSchool", direction: "OneWay")
    eventSessions: [EventSession] @relation(name: "EventSessionEvent")
    isEmailCommsEnabled: Boolean @defaultValue(value: "false")
    eventTicket: [EventTicket] @relation(name: "EventTicketEvent")
    shouldSendRescheduledComms: Boolean @defaultValue(value: "false")
    rescheduledReason: String
    shouldSendCanceledComms: Boolean @defaultValue(value: "false")
    cancellationReason: String
    ticketName: String
    ticketregistrationLimit: Int
    ticketPrice: Float
    ticketEndsCondition: DateCondition
    ticketEndsInUnit: DurationType
    ticketEndsInValue: Int
  }
`;

export default [Event, EventAttendance, EventCertificateEmbed, UTMParameters, EventCommsRule, CommsVariableType];

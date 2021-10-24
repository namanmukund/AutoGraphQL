import {
  TBA,
  TLA,
  TWA,
  TMS,
} from '../../../../constants';

const EventCertificate = `
  type EventCertificate @model
  @appPermissions(
    permissions:[
      { appName: "${TLA}" operations: "*" },
      { appName: "${TBA}" operations: "*" },
      { appName: "${TWA}" operations: "*" },
      { appName: "${TMS}" operations: "*" },
      ], 
    rule: allow
  )
  {
    user: User! @relation(name: "EventCertificateUser", direction: "OneWay")
      @appPermissions(
        permissions:[
          { appName: "${TBA}" operations: "*" },
          { appName: "${TMS}" operations: "*" },
          ], 
        rule: allow
      )
    file: File @relation(name: "EventCertificateFile", direction: "OneWay")
    signedUrl: String
    eventType: EventType @defaultValue(value: "radioStreet")
    eventName: EventName @defaultValue(value: "spySquadCamp")
  }
`;

export default EventCertificate;

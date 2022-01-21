import { TBA, TMS } from '../../../../constants';

const EventJoinReason = `
  type EventJoinReason @model
  {
    title: String
    events: [Event] @relation(name: "EventJoinReasonEvent")
    @appPermissions(
        permissions:[
          { appName: "${TBA}" operations: "*" },
          { appName: "${TMS}" operations: "*" }],
        rule: allow
      ) 
    picture: File @relation(name: "EventJoinReasonPicture", direction: "OneWay")
  }
`;

export default [EventJoinReason];

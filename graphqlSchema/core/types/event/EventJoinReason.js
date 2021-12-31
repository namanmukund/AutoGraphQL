const EventJoinReason = `
  type EventJoinReason @model
  {
    title: String
    events: [Event] @relation(name: "EventJoinReasonEvent")
    picture: File @relation(name: "EventJoinReasonPicture", direction: "OneWay")
  }
`;

export default [EventJoinReason];

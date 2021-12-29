const EventJoinReason = `
  type EventJoinReason @model
  {
    title: String
    event: Event! @relation(name: "EventJoinReasonEvent")
    picture: File @relation(name: "EventJoinReasonPicture", direction: "OneWay")
  }
`;

export default [EventJoinReason];

const EventJoinReason = `
  type EventJoinReason @model
  {
    title: String
    event: Event! @relation(name: "EventJoinReasonEvent")
    banner: File @relation(name: "EventJoinReasonBanner", direction: "OneWay")
  }
`;

export default [EventJoinReason];

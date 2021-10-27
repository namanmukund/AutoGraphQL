const GetEventCertificateResult = `
  type GetEventCertificateResult {
    name: String
    userId: String
    assetUrl: String
    eventType: EventType @defaultValue(value: "radioStreet")
    eventName: EventName @defaultValue(value: "spySquadCamp")
  }
`;

export default [GetEventCertificateResult];

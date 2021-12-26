const EventSpeaker = `
  type EventSpeaker @model {
    user: User! @relation(name: "EventSpeakerUser")
    event: Event @relation(name: "EventSpeakerEvent")
    gitHubLink: String
    linkedInLink: String
    portfolioLink: String
    roleAtOrganization: String
    organization: String
    about: String
}`;

export default [EventSpeaker];

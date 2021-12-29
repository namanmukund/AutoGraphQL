const EventSpeakerProfile = `
  type EventSpeakerProfile @model {
    user: User! @relation(name: "EventSpeakerProfileUser")
    event: [Event] @relation(name: "EventSpeakerProfileEvent")
    linkedInLink: String
    roleAtOrganization: String
    organization: String
    about: String
}`;

export default [EventSpeakerProfile];

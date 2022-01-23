import { TBA, TMS } from '../../../../constants';

const GetSpeakerProfile = `
  type GetEventSpeaker
  {
    user: User! @relation(name: "GetEventSpeakerUser")
    linkedInLink: String
    roleAtOrganization: String
    organization: String
    about: String
}`;

const EventSpeakerProfile = `
  type EventSpeakerProfile @model
  {
    user: User! @relation(name: "EventSpeakerProfileUser")
    events: [Event] @relation(name: "EventSpeakerProfileEvent")
    @appPermissions(
        permissions:[
          { appName: "${TBA}" operations: "*" },
          { appName: "${TMS}" operations: "*" }],
        rule: allow
      ) 
    linkedInLink: String
    roleAtOrganization: String
    organization: String
    about: String
}`;

export default [EventSpeakerProfile, GetSpeakerProfile];

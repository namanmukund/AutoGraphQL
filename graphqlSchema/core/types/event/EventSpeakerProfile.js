import { TBA, TMS } from '../../../../constants';

const GetSpeakerProfile = `
  type GetEventSpeaker
  {
    linkedInLink: String
    roleAtOrganization: String
    organization: String
    about: String
    name: String
    profilePic: String
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

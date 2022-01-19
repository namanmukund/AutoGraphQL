import { TBA, TMS } from '../../../../constants';

const EventCategory = `
  type EventCategory @model 
  @userToken(isRequired:"false")
  {
    title: String
    events: [Event] @relation(name: "EventCategoryEvent")
    displayOnWebsite: Boolean
    createdBy: User @relation(name: "EventCategoryUser", direction: "OneWay")
    @appPermissions(
        permissions:[
          { appName: "${TMS}" operations: "*" },
          { appName: "${TBA}" operations: "*" },
          ],
        rule: allow
      )
    status: EventStatus
  }
`;

export default [EventCategory];

import {
  TBA, TLA, TMS, TWA,
} from '../../../../constants';
import { READ } from '../../../../constants/graphqlOperations';

const EventCategory = `
  type EventCategory @model 
  @userToken(isRequired:"false")
  @appPermissions(
        permissions:[
          { appName: "${TLA}" operations: ${READ} },
          { appName: "${TWA}" operations: ${READ} },
          { appName: "${TMS}" operations: "*" },
          { appName: "${TBA}" operations: "*" },
          ],
        rule: allow
      )
  {
    title: String
    events: [Event] @relation(name: "EventCategoryEvent")
    @appPermissions(
        permissions:[
          { appName: "${TMS}" operations: "*" },
          { appName: "${TBA}" operations: "*" },
          ],
        rule: allow
      )
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

import { TBA, TMS } from '../../../../constants';

const EventPrize = `
  type EventPrize @model 
  {
    title: String
    image: File @relation(name: "EventPrizeFile", direction: "OneWay")
    minRank: Int
    maxRank: Int
    events: [Event] @relation(name: "EventPrizeEvent")
    @appPermissions(
        permissions:[
          { appName: "${TBA}" operations: "*" },
          { appName: "${TMS}" operations: "*" }],
        rule: allow
      ) 
  }
`;

export default [EventPrize];

const EventPrize = `
  type EventPrize @model 
  {
    title: String
    image: File @relation(name: "EventPrizeFile", direction: "OneWay")
    minRank: Int
    maxRank: Int
    events: [Event] @relation(name: "EventPrizeEvent") @userToken(isRequired:"false")
  }
`;

export default [EventPrize];

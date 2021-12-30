const EventPrize = `
  type EventPrize @model 
  {
    title: String
    image: File @relation(name: "EventPrizeFile", direction: "OneWay")
    minRank: Int
    maxRank: Int
    event: [Event] @relation(name: "EventPrizeEvent")
  }
`;

export default [EventPrize];

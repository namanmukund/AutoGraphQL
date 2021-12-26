const EventPrize = `
  type EventPrize @model 
  {
    title: String
    image: File
    minRank: Int
    maxRank: Int
    event: Event! @relation(name: "EventPrizeEvent")
  }
`;

export default [EventPrize];

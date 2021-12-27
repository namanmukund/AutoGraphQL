const EventCategory = `
  type EventCategory @model 
  {
    title: String
    event: Event! @relation(name: "EventCategoryEvent")
    displayOnWebsite: Boolean
    createdOn: Date
    createdBy: User! @relation(name: "EventCategoryUser", direction: "OneWay")
    status: [EventStatus]
  }
`;

export default [EventCategory];

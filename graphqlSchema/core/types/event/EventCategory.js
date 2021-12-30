const EventCategory = `
  type EventCategory @model 
  {
    title: String
    events: [Event] @relation(name: "EventCategoryEvent")
    displayOnWebsite: Boolean
    createdBy: User! @relation(name: "EventCategoryUser", direction: "OneWay")
    status: EventStatus
  }
`;

export default [EventCategory];

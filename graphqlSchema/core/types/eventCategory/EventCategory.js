const EventCategory = `
  type EventCategory @model 
  {
    name: String
    event: Event! @relation(name: "EventCategoryEvent")
  }
`;

export default [EventCategory];

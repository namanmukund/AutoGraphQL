const EventTicket = `
  type EventTicket @model {
    event: Event! @relation(name: "EventTicketEvent")
    user: User! @relation(name: "EventTicketUser", direction: "OneWay")
}`;

export default [EventTicket];

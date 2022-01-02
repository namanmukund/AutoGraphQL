const EventTicket = `
  type EventTicket @model {
    name: String
    registrationLimit: Int
    price: Float
    ticketEndsCondition: Date
    ticketEndsInUnit: Int
    ticketEndsInValue: Int
    event: Event! @relation(name: "EventTicketEvent")
    user: User! @relation(name: "EventTicketUser", direction: "OneWay")
}`;

export default [EventTicket];

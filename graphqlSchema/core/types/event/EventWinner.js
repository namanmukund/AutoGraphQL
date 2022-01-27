const GetEventWinner = `
  type GetEventWinner
  {
    user: User @relation(name: "GetEventWinnerUser", direction: "OneWay")
    profilePic: File @relation(name: "GetEventWinnerProfilePic", direction: "OneWay")
}`;

const EventWinner = `
  type EventWinner @model
  {
    studentProfile: StudentProfile @relation(name: "EventWinnerStudentProfile")
    event: Event @relation(name: "EventWinnerEvent")
    image: File @relation(name: "EventWinnerImage", direction: "OneWay")
    prize: EventPrize @relation(name: "EventWinnerPrize", direction: "OneWay")
    showCertificate: Boolean @defaultValue(value: "true")
}`;

export default [EventWinner, GetEventWinner];

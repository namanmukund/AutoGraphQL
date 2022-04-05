const GetEventWinner = `
  type GetEventWinner
  {
    userName: String
    profilePicUrl: String
    prizeTitle: String
    prizeCount: Int
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

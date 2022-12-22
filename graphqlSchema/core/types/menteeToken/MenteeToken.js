const MenteeToken = `
  type MenteeToken @model @databaseController(mode: "aggregation") {
    token: String
    user: User @relation(name: "UserTokenUser", direction: "OneWay")
    studentProfile: StudentProfile @relation(name: "UserTokenStudentProfile", direction: "OneWay")
  }
`;

export default [MenteeToken];

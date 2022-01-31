const CommsSendLog = `
  type CommsSendLog @model 
  {
    templateName: String
    triggedAt: Date
    studentProfile: StudentProfile @relation(name: "CommsSendLogStudentProfile", direction: "OneWay")
    event: Event @relation(name: "CommsSendLogEvent", direction: "OneWay")
  }
`;

export default [CommsSendLog];

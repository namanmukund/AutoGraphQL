const commsInput = `
  input commsInput {
    mail: Boolean @defaultValue(value: "false")
    templateName: String
    studentName: String
    parentName : String
    studentGrade: String
    eventDate: String
    eventName: String
    speakerName: String
    parentEmail: String
    parentPhone: String
  }
`;

export default [commsInput];

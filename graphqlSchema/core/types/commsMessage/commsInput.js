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
    eventTime: String
    eventCertificateLink: String
    meetingId: String
    meetingLink: String
    meetingPassword: String
    geoLocation: String
    address: String
    summary: String
    description: String
    paymentLink: String
    eventRegistrationLink: String
  }
`;

export default [commsInput];

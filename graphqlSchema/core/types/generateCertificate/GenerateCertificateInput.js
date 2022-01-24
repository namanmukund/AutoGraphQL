const GenerateCertificateInput = `
  input GenerateCertificateInput {
    userId: String
    eventId: String
    regenerateCertificate: Boolean @defaultValue(value: "false")
    isBulkGenerate: Boolean @defaultValue(value: "false")
    date: Date
    isEventCertificate: Boolean @defaultValue(value: "true")
  }
`;

export default GenerateCertificateInput;

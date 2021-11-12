const GenerateCertificateInput = `
  input GenerateCertificateInput {
    userId: String
    eventId: String
    regenerateCertificate: Boolean @defaultValue(value: "false")
  }
`;

export default GenerateCertificateInput;

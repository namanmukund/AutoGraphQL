const GenerateCertificateInput = `
  input GenerateCertificateInput {
    userId: String
    regenerateCertificate: Boolean @defaultValue(value: "false")
  }
`;

export default GenerateCertificateInput;

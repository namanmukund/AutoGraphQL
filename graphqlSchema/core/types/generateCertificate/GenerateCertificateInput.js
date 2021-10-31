const GenerateCertificateInput = `
  input GenerateCertificateInput {
    userId: String
    regenerateCertificate: Boolean @defaultValue(value: "true")
  }
`;

export default GenerateCertificateInput;

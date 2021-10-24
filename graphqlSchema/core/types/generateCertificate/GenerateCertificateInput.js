const GenerateCertificateInput = `
  input GenerateCertificateInput {
    phoneNumber: String
    regenerateCertificate: Boolean @defaultValue(value: "false")
  }
`;

export default GenerateCertificateInput;

const CourseCertificateResult = `
  type CourseCertificateResult {
    name: String
    userId: String
    courseName: String
    certificate: File @relation(name: "CourseCertificate", direction: "OneWay")
  }
`;

export default [CourseCertificateResult];

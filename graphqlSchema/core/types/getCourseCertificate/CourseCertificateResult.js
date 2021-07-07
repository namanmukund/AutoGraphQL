const CourseCertificateResult = `
  type CourseCertificateResult {
    name: String
    courseName: String
    certificate: File @relation(name: "CourseCertificate", direction: "OneWay")
  }
`;

export default [CourseCertificateResult];

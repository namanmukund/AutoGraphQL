const CourseCertificateResult = `
  type CourseCertificateResult {
    name: String
    userId: String
    courseId: String
    courseName: String
    courseDuration: String
    courseEndingDate: String
    mentors: [String]
    profiency: String
    certificate: File @relation(name: "CourseCertificate", direction: "OneWay")
  }
`;

export default [CourseCertificateResult];

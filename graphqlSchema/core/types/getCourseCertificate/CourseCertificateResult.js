const CourseCertificateResult = `
  type CourseCertificateResult {
    name: String
    userId: String
    courseId: String
    courseName: String
    courseThumbnail: File @relation(name: "CourseThumbnail", direction: "OneWay")
    courseDuration: String
    courseEndingDate: String
    mentors: [String]
    proficiency: String
    projectsCount: Int
    certificate: File @relation(name: "CourseCertificate", direction: "OneWay")
  }
`;

export default [CourseCertificateResult];

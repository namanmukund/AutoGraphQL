const MentorProfile = `
  type MentorProfile @model {
    user: User! @relation(name: "MentorProfileUser")
    codingLanguages: [CodingLanguage]
    experienceYear: Int
    sessionLink: String
    meetingId: String
    meetingPassword: String
    pythonCourseRating5: Int
    pythonCourseRating4: Int
    pythonCourseRating3: Int
    pythonCourseRating2: Int
    pythonCourseRating1: Int
    salesExecutive: SalesExecutiveProfile @relation(name: "SalesExecutiveProfileMentorProfile")
}`;

export default [MentorProfile];

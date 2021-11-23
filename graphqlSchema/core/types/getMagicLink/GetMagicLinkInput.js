const GetMagicLinkInput = `
  input GetMagicLinkInput {
    schoolId: String
    grade: Grade
    section: Section
    userId: String
    email: String
    phone: PhoneInput
    expiresIn:Int
  }
`;

export default [GetMagicLinkInput];

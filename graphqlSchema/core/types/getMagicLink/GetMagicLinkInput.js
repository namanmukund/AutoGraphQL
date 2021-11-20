const GetMagicLinkInput = `
  input GetMagicLinkInput {
    classId: String
    userId: String
    email: String
    phone: PhoneInput
    linkType: LinkType @defaultValue(value: "login")
  }
`;

export default [GetMagicLinkInput];

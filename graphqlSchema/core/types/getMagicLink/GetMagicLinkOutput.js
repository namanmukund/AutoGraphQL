const GetMagicLinkOutput = `
  type GetMagicLinkOutput {
    linkToken: String
    expiresIn: Int
    linkUri: String
    school: School @relation(name: "GetMagicLinkOutputSchool", direction: "OneWay")
    user: User @relation(name: "GetMagicLinkOutputUser", direction: "OneWay")
  }
`;

export default [GetMagicLinkOutput];

const GetMagicLinkOutput = `
  type GetMagicLinkOutput {
    userToken: String
    expiryToken: String
    expiresIn: Int
    linkUri: String
  }
`;

export default [GetMagicLinkOutput];

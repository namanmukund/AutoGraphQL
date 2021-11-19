const GetMagicLinkOutput = `
  type GetMagicLinkOutput {
    userToken: String
    expiryToken: String
    expiresIn: String
    loginLink: String
  }
`;

export default [GetMagicLinkOutput];

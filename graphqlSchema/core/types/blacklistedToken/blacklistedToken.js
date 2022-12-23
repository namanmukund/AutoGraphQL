const blacklistedToken = `
  type BlacklistedToken @model {
    encodedToken: String! @unique
    type: TokenType @defaultValue(value: "encodedAppAndUserToken")
  }
`;

export default blacklistedToken;

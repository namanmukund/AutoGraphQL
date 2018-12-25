const blacklistedToken = `
  type BlacklistedToken @model {
    encodedToken: String! @unique
  }
`;

export default blacklistedToken;

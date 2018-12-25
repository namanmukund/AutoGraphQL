const AppToken = `
  type AppToken @model {
    name: String! @unique
    token:  String! @auto
    type:  ApplicationType!
}
`;

export default AppToken;

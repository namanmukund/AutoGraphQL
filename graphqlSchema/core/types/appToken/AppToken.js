const AppToken = `
  type AppToken @model 
    @appPermissions( permissions: "*", rule: deny)
  {
    name: String! @unique
    token:  String! @auto
    type:  ApplicationType!
}
`;

export default AppToken;

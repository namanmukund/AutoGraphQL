const AppVersion = `
  type AppVersion @model {
    appName: AppName! @unique
    versionCode: Int @defaultValue(value: 0)
    versionName: String!  @defaultValue(value: "1.0")
  }
`;

export default AppVersion;

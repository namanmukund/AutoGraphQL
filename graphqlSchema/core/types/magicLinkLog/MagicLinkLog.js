const MagicLinkLog = `
  type MagicLinkLog @model {
    user: User! @relation(name: "MagicLinkLogUser", direction: "OneWay")
    userToken: String!
    expiresIn: String
    expiryToken: String
    isActive: Boolean @defaultValue(value: "false")
    visitedCount: Int
    linkType: LinkType @defaultValue(value: "login")
    generatedLink: String
    appName: AppName
}`;

export default MagicLinkLog;

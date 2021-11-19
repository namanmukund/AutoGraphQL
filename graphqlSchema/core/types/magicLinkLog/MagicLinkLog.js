const MagicLinkLog = `
  type MagicLinkLog @model {
    user: User!
    userToken: String!
    expiresIn: String
    expiryToken: String
    isActive: Boolean @defaultValue(value: "false")
    visitedCount: Int
    linkType: LinkType @defaultValue(value: "login")
    generatedLink: String
}`;

export default [MagicLinkLog];

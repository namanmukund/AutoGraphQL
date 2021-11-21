const MagicLinkLog = `
  type MagicLinkLog @model {
    user: User! @relation(name: "MagicLinkLogUser", direction: "OneWay")
    userToken: String!
    expiresIn: Int
    expiryToken: String
    isLinkVisited: Boolean @defaultValue(value: "false")
    visitedCount: Int
    linkUri: String
    linkGeneratedFrom: AppName
    linkGeneratedby: User @relation(name: "MagicLinkLoglinkGeneratedby", direction: "OneWay")
    school: School @relation(name: "MagicLinkLogSchool", direction: "OneWay")
    grade: Grade
    section: Section
    firstLinkVisitedDate: Date
}`;

export default MagicLinkLog;

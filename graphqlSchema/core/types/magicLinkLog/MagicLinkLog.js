const MagicLinkLog = `
  type MagicLinkLog @model {
    user: User! @relation(name: "MagicLinkLogUser", direction: "OneWay")
    linkToken: String!
    expiresIn: Int
    isLinkVisited: Boolean @defaultValue(value: "false")
    visitedCount: Int
    linkUri: String
    linkGeneratedFrom: AppName
    linkGeneratedby: User @relation(name: "MagicLinkLoglinkGeneratedby", direction: "OneWay")
    school: School @relation(name: "MagicLinkLogSchool", direction: "OneWay")
    grade: Grade
    section: Section
    firstLinkVisitedDate: Date
    linkVisitLimit: Int
    isLeadLogin: Boolean @defaultValue(value: "false")
}`;

export default MagicLinkLog;

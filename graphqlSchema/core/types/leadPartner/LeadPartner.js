const LeadPartner = `
  type LeadPartner @model {
    admins: [User] @relation(name:"LeadPartnerAdminUser", direction: "OneWay")
    agents: [LeadPartnerAgent] @relation(name:"LeadPartnerAgentUser")
    title: String!
}`;

const Timezones = `
 type Timezones {
   value: String
 }
`;

const LeadPartnerAgent = `
  type LeadPartnerAgent @model {
    utmDetails: [UtmDetail] @relation(name: "LeadPartnerAgentUtmDetail")
    leadPartner: LeadPartner @relation(name:"LeadPartnerAgentUser")
    countries: [Countries]
    agent: User @relation(name:"LeadPartnerAgentUser", direction: "OneWay")
    timezones: [Timezones]
}`;

export default [LeadPartner, LeadPartnerAgent, Timezones];

const LeadPartner = `
  type LeadPartner @model {
    admins: [User] @relation(name:"LeadPartnerAdminUser", direction: "OneWay")
    agents: [LeadPartnerAgent] @relation(name:"LeadPartnerAgentUser")
    title: String!
}`;

const LeadPartnerAgent = `
  type LeadPartnerAgent @model {
    utmDetails: [UtmDetail] @relation(name: "LeadPartnerAgentUtmDetail") 
    leadPartner: LeadPartner @relation(name:"LeadPartnerAgentUser")
    agent: User @relation(name:"LeadPartnerAgentUser", direction: "OneWay")
    dayWiseBooking: Int
    monthlyBooking: Int
    dayWiseConduction: Int
    monthlyConduction: Int
}`;

export default [LeadPartner, LeadPartnerAgent];

const LeadPartner = `
  type LeadPartner @model {
    utmDetails: [UtmDetail] @relation(name: "LeadPartnerUtmDetail")
    title: String!
    agent: User @relation(name:"LeadPartnerUser", direction: "OneWay")
}`;

export default [LeadPartner];

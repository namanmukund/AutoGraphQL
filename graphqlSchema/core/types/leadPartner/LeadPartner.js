const LeadPartner = `
  type LeadPartner @model {
    utmDetails: [UtmDetail] @relation(name: "LeadPartnerUtmDetail")
    title: String!
}`;

export default [LeadPartner];

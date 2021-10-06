const GetSchoolCampaignSlotsResult = `
  type GetSchoolCampaignSlotsResult {
    id: String
    title: String
    whiteLabel: Boolean @defaultValue(value: "false")
    slots: [CampaignSlots]
    schoolId: String
    schoolName: String
    classes: [SchoolClass]
    schoolLogo: File @relation(name: "GetCampaignSlotsResultFile", direction: "OneWay")
    campaignType: String
    poster: File @relation(name: "GetCampaignPosterFile", direction: "OneWay")
    posterMobile: File @relation(name: "GetCampaignPosterFile", direction: "OneWay")
    campaignCode: String
  }
`;

export default [GetSchoolCampaignSlotsResult];

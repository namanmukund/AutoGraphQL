import getSlotTimeFields from '../../functions/getSlotTimeFields';

const slotTimeFields = getSlotTimeFields('Boolean', false);

const CampaignSlots = `
  type CampaignSlots {
   bookingDate: Date
   ${slotTimeFields}
   showSlot: Boolean
 }`;

const GetCampaignSlotsResult = `
  type GetCampaignSlotsResult {
    id: String
    slots: [CampaignSlots]
    schoolId: String
    schoolName: String
    classes: [SchoolClass]
    schoolLogo: File @relation(name: "GetCampaignSlotsResultFile", direction: "OneWay")
    campaignType: String
    poster: File @relation(name: "GetCampaignPosterFile", direction: "OneWay")
  }
`;

export default [GetCampaignSlotsResult, CampaignSlots];

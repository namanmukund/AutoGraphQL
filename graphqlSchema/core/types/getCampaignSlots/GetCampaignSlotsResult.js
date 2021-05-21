import getSlotTimeFields from '../../functions/getSlotTimeFields';

const slotTimeFields = getSlotTimeFields('Boolean', false);

const CampaignSlots = `
  type CampaignSlots {
   bookingDate: Date
   ${slotTimeFields}
   allottedMentorId: ID
   mentorSessionId: ID
 }`;

const GetCampaignSlotsResult = `
  type GetCampaignSlotsResult {
    id: String
    slots: [CampaignSlots]
    schoolName: String
    classes: [SchoolClass]
    schoolLogo: File @relation(name: "GetCampaignSlotsResultFile", direction: "OneWay")
    campaignType: String
    poster: File @relation(name: "GetCampaignPosterFile", direction: "OneWay")
    type: String
  }
`;

export default [GetCampaignSlotsResult, CampaignSlots];

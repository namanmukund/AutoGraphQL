import { campaignTypes } from '../../../../../constants';

const { b2b, b2b2cPaid, b2b2cEvent } = campaignTypes;
const CampaignType = `
  enum CampaignType {
    ${b2b}
    ${b2b2cPaid}
    ${b2b2cEvent}
  }`;

export default CampaignType;

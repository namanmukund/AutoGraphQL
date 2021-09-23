import getSlotTimeFields from '../../functions/getSlotTimeFields';
import { READ } from '../../../../constants/graphqlOperations';
import { TLA, TMS, TWA } from '../../../../constants';

const slotTimeFields = getSlotTimeFields('PriceInputType');

const MentorSupplyPaySlab = `
  type MentorSupplyPaySlab @model 
  @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: "*" },
      { appName: "${TLA}" operations: ${READ} },
      { appName: "${TWA}" operations: ${READ} }
      ], 
    rule: allow
  ) {
    title: String
    description: String
    vertical: Vertical
    ${slotTimeFields}
}`;

export default [MentorSupplyPaySlab];

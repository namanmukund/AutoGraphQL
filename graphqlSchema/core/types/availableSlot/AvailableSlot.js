import getSlotTimeFields from '../../functions/getSlotTimeFields';
import { TMS, TWA } from '../../../../constants';
import { READ } from '../../../../constants/graphqlOperations';

const slotTimeFields = getSlotTimeFields('Int', 0);

const AvailableSlot = `
  type AvailableSlot @model 
    @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: ${READ} },
      { appName: "${TWA}" operations: ${READ} }
      ], 
    rule: allow
  ) 
  {
    date: Date
    country: Country @defaultValue(value: "india")
    ${slotTimeFields}
}`;

export default [AvailableSlot];

import getSlotTimeFields from '../../functions/getSlotTimeFields';
import { TMS } from '../../../../constants';
import { READ } from '../../../../constants/graphqlOperations';

const slotTimeFields = getSlotTimeFields('Int', 0);

const AvailableSlot = `
  type AvailableSlot @model 
    @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: ${READ} }], 
    rule: allow
  ) 
  {
    date: Date
    ${slotTimeFields}
}`;

export default [AvailableSlot];

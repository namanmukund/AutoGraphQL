import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import validateAuthentication from '../../../../../../utils/validateAuthentication';
import getSlotTimesInString from '../../../../../../utils/getSlotTimesInString';
import getSelectedSlotsTime from '../../../preHookFunctions/validation/utils/getSelectedSlotsTime';
import { DatabaseRecordNotFoundError } from '../../../../../../constants/errors';
import { batchType } from '../../../../../../constants';

const getSchoolCampaigns = (schoolCode) => `
{
  campaigns(filter:{
    school_some:{
      code:"${schoolCode}"
    }
  }){
    id
    code
    type
    title
    poster {
      id
    }
    classes {
      section
      grade
    }
    batches{
      type
      b2b2ctimeTable{
        bookingDate
        ${getSlotTimesInString()}
      }
      studentsMeta{
        count
      }
    }
    batchRules{
      batchSize
    }
    school{
      id
      name
      whiteLabel
      logo{
        id
      }
    }
  }
}
`;

// method to construct timeslots array and which slots are filled and which are not
const getTimeSlotsForB2B2C = async (batches, maxBatchSize) => {
  const slotsArray = [];
  if (batches && batches.length) {
    // iterating over each b2b2c batches in the campaign with timetable rule
    // if there are multiple object for same date and time we will just check if slots are free for any of them
    batches.forEach((batch) => {
      if (batch && batch.type === batchType.b2b2c && batch.b2b2ctimeTable && batch.b2b2ctimeTable.bookingDate) {
        const studentsMeta = get(batch, 'studentsMeta.count', 0);
        const {
          bookingDate,
          ...slots
        } = batch.b2b2ctimeTable;
        const slotTimeArray = getSelectedSlotsTime(slots);
        if (slotTimeArray.length === 1) {
          let found = false;
          // iterating over slotsArray to check if the booking date and slot combination already exists
          // if it is found we only check if students slot are available in this and will not push it in array again
          // eslint-disable-next-line no-plusplus
          for (let i = 0; i < slotsArray.length; i++) {
            if (slotsArray[i].bookingDate.toISOString() === bookingDate.toISOString() && slotsArray[i][`slot${slotTimeArray[0]}`] === true) {
              found = true;
              // checking if slot was not free for earlier batch then we check if it is available for this batch
              if (!slotsArray[i].showSlot && studentsMeta < maxBatchSize) {
                slotsArray[i].showSlot = true;
              }
              break;
            }
          }
          if (!found) {
            slotsArray.push({
              bookingDate,
              [`slot${slotTimeArray[0]}`]: true,
              showSlot: studentsMeta < maxBatchSize,
            });
          }
        }
      }
    });
  }
  return slotsArray;
};

// this API will return all the campaign slots for a school along with other necessary info
const getSchoolCampaignSlots = (async (root, params, context) => {
  validateAuthentication(context, 'app');
  context.currentUser = true;
  // getting input from params
  const { input: { schoolCode } } = params;
  // this will be sent in output
  const schoolResult = [];

  const getCampaignRes = await callLocalGraphqlApi(getSchoolCampaigns(schoolCode));
  const schoolCampaigns = get(getCampaignRes, 'data.campaigns', []);
  schoolCampaigns.forEach((campaign) => {
    const result = {};
    const campaignId = get(campaign, 'id', '');
    const campaignCode = get(campaign, 'code', '');
    const schoolId = get(campaign, 'school.id', '');
    const schoolName = get(campaign, 'school.name', '');
    const schoolLogoId = get(campaign, 'school.logo.id', '');
    const posterId = get(campaign, 'poster.id', '');
    const title = get(campaign, 'title', '');
    const whiteLabel = get(campaign, 'school.whiteLabel', '');
    const classes = get(campaign, 'classes', []);
    const batches = get(campaign, 'batches', []);
    // by default taking value as 1 in worst case
    const maxBatchSize = get(campaign, 'batchRules.batchSize', 1);
    if (!campaignId) {
      throw new DatabaseRecordNotFoundError();
    }

    const { type } = campaign;
    // get slots for b2b2c campaign and populate logic which is full and which is not
    const slotsArray = getTimeSlotsForB2B2C(batches, maxBatchSize);

    result.id = campaignId;
    result.campaignCode = campaignCode;
    result.slots = slotsArray;
    result.schoolName = schoolName;
    result.whiteLabel = whiteLabel;
    result.classes = classes;
    result.schoolId = schoolId;
    result.title = title;
    if (schoolLogoId) {
      result.schoolLogo = { type: 'File', typeId: `${schoolLogoId}` };
    }
    if (posterId) {
      result.poster = { type: 'File', typeId: `${posterId}` };
    }
    result.campaignType = type;
    schoolResult.push(result);
  });

  return schoolResult;
});

export default getSchoolCampaignSlots;

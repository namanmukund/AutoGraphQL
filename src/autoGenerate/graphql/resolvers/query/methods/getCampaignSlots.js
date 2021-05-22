import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import validateAuthentication from '../../../../../../utils/validateAuthentication';
import getSlotTimesInString from '../../../../../../utils/getSlotTimesInString';
import getSelectedSlotsTime from '../../../preHookFunctions/validation/utils/getSelectedSlotsTime';
import { DatabaseRecordNotFoundError } from '../../../../../../constants/errors';
import { batchType } from '../../../../../../constants';

const getCampaign = (code) => `
{
  campaigns(filter: {code: "${code}"}){
    id
    timeTableRules{
      bookingDate
       ${getSlotTimesInString()}
    }
    type
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
      logo{
        id
      }
    }
  }
}
`;

// method to construct timeslots array and which slots are filled and which are not
const getTimeSlotsForB2B2C = async (timeTableRules, batches, maxBatchSize) => {
  const slotsArray = [];
  if (timeTableRules && timeTableRules.length) {
    // iterating over each timetable object in timeTableRulesin the campaign
    // if there are multiple object for same date and time we will add maximumAllowableStudentsInaBatch
    timeTableRules.forEach((timeTableRule) => {
      let maximumAllowableStudentsInaBatch = maxBatchSize;
      const {
        bookingDate, ...slots
      } = timeTableRule;
      const slotTimeArray = getSelectedSlotsTime(slots);
      if (slotTimeArray.length === 1) {
        let found = false;
        // iterating over slotsArray to check if the boking date and slot combination already exists
        // it it is found we only increase maximumAllowableStudentsInaBatch and will not push it in array again
        // eslint-disable-next-line no-plusplus
        for (let i = 0; i < slotsArray.length; i++) {
          if (slotsArray[i].bookingDate === bookingDate && slotsArray[i][`slot${slotTimeArray[0]}`] === true) {
            found = true;
            maximumAllowableStudentsInaBatch += maxBatchSize;
            break;
          }
        }
        if (!found) {
          slotsArray.push({
            bookingDate,
            [`slot${slotTimeArray[0]}`]: true,
            maxBatchSize: maximumAllowableStudentsInaBatch,
            studentsCount: 0,
          });
        }
      }
    });
  }

  // iterating over all the b2b2c batches to check how many students have booked the slots
  if (batches && batches.length) {
    batches.forEach((batch) => {
      if (batch && batch.type === batchType.b2b2c && batch.b2b2ctimeTable && batch.studentsMeta && batch.studentsMeta.count) {
        const {
          bookingDate, ...slots
        } = batch.b2b2ctimeTable;
        const slotTimeArray = getSelectedSlotsTime(slots);
        if (slotTimeArray.length === 1 && bookingDate) {
          // here we are appending the stuent count for a particular booking date and slot
          // eslint-disable-next-line no-plusplus
          for (let i = 0; i < slotsArray.length; i++) {
            const bookingDateInCampaign = new Date(slotsArray[i].bookingDate);
            bookingDateInCampaign.setHours(0, 0, 0, 0);
            const bookingDateInBatch = new Date(bookingDate);
            bookingDateInBatch.setHours(0, 0, 0, 0);
            if (bookingDateInCampaign.toISOString() === bookingDateInBatch.toISOString() && slotsArray[i][`slot${slotTimeArray[0]}`] === true) {
              slotsArray[i].studentsCount += batch.studentsMeta.count;
              break;
            }
          }
        }
      }
    });
  }

  // here just iterating again to populate showSlot
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < slotsArray.length; i++) {
    if (slotsArray[i].studentsCount < slotsArray[i].maxBatchSize) {
      slotsArray[i].showSlot = true;
    } else {
      slotsArray[i].showSlot = false;
    }
  }
  return slotsArray;
};

// this API will return all the campaign slots for a campaign along with other necessary info
const getCampaignSlots = (async (root, params, context) => {
  validateAuthentication(context, 'app');
  context.currentUser = true;
  // getting input from params
  const { input: { code } } = params;
  // this will be sent in output
  const result = {};

  const getCampaignRes = await callLocalGraphqlApi(getCampaign(code));
  const campaign = get(getCampaignRes, 'data.campaigns[0]', {});
  const campaignId = get(getCampaignRes, 'data.campaigns[0].id', {});
  const schoolId = get(getCampaignRes, 'data.campaigns[0].school.id', '');
  const schoolName = get(getCampaignRes, 'data.campaigns[0].school.name', '');
  const schoolLogoId = get(getCampaignRes, 'data.campaigns[0].school.logo.id', '');
  const posterId = get(getCampaignRes, 'data.campaigns[0].poster.id', '');
  const classes = get(getCampaignRes, 'data.campaigns[0].classes', []);
  const batches = get(getCampaignRes, 'data.campaigns[0].batches', []);
  // by default taking value as 1 in worst case
  const maxBatchSize = get(getCampaignRes, 'data.campaigns[0].batchRules.batchSize', 1);
  if (!campaignId) {
    throw new DatabaseRecordNotFoundError();
  }

  const { timeTableRules, type } = campaign;
  // get slots for b2b2c campaign and populate logic which is full and which is not
  const slotsArray = getTimeSlotsForB2B2C(timeTableRules, batches, maxBatchSize);

  result.id = campaignId;
  result.slots = slotsArray;
  result.schoolName = schoolName;
  result.classes = classes;
  result.schoolId = schoolId;
  if (schoolLogoId) {
    result.schoolLogo = { type: 'File', typeId: `${schoolLogoId}` };
  }
  if (posterId) {
    result.poster = { type: 'File', typeId: `${posterId}` };
  }
  result.campaignType = type;

  return result;
});

export default getCampaignSlots;

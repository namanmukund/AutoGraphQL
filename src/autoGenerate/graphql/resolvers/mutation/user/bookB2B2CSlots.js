import { get } from 'lodash';
import validateAuthentication from '../../../../../../utils/validateAuthentication';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import getSelectedSlotsTime from '../../../preHookFunctions/validation/utils/getSelectedSlotsTime';
import { NoSlotSelectedError, OnlyOneSlotAllowedError } from '../../../../../../constants/errors/input';
import { BatchFullError } from '../../../../../../constants/errors';

// query to fetch student profile id on basis of user id
const fetchUser = (userId) => `
  query{
    user(id: "${userId}"){
      id
      studentProfile {
        id
      }
    }
  }
  `;

// query to fetch batch
const fetchBatch = (campaignId, bookingDate, slotInput) => `
  query{
    batches(filter:{
      and: [
        {
          campaign_some: {
            id: "${campaignId}"
          }
        },
        {
          ${slotInput}: true
        },
        {
          b2b2ctimeTable_bookingDate_subDoc: "${bookingDate}"
        }
      ]
    }){
      id
      campaign{
        batchRules{
          batchSize
        }
      }
      studentsMeta{
        count
      }
    }
  }
  `;

// query to fetch batch n basis of studentProfileId
const fetchBatchForStudent = (studentProfileId) => `
  query{
    batches(filter:{
      and: [
        {
          students_some:{
            id: "${studentProfileId}"
          }
        },
        {
          type: b2b2c
        }
      ]
    }){
      id
    }
  }
  `;

// mutation to update batch
const updateBatch = (batchId, studentId) => `
  mutation{
    updateBatch(id:"${batchId}", studentsConnectIds: ["${studentId}"], input:{}){
      id
    }
  }
  `;

// mutation to remove student from a batch
const removeStudentFromBatch = (batchId, studentId) => `
  mutation{
    removeFromBatchStudentProfile(studentProfileId:"${studentId}", batchId:"${batchId}"){
      studentProfile{
        id
      }
    }
  }
  `;

/*
This mutation is called when b2b2c user tries to book a slot
*/
const bookB2B2CSlotsMutationResolver = async (
  root,
  params,
  typeName,
  info,
  mutationName,
  ast,
  context,
) => {
  validateAuthentication(context);
  const {
    input: {
      campaignId,
      userId,
      bookingDate,
      ...slots
    },
  } = params;
  console.log('--------------------------campaignId', campaignId)
  console.log('--------------------------userId', userId)
  console.log('--------------------------bookingDate', bookingDate)
  console.log('--------------------------slots', slots)


  const slotTimeArray = getSelectedSlotsTime(slots);

  if (!slotTimeArray.length) {
    throw new NoSlotSelectedError();
  } else if (slotTimeArray.length > 1) {
    throw new OnlyOneSlotAllowedError();
  }


  const fetchUserRes = await callLocalGraphqlApi(fetchUser(userId));
  const studentProfileId = get(fetchUserRes, 'data.user.studentProfile.id', '');
  if (!studentProfileId) {
    throw new DatabaseRecordNotFoundError();
  }

  // fetch batch on the basis of campaign and slots
  const slotInput = `b2b2ctimeTable_slot${slotTimeArray[0]}_subDoc`;
  const formattedBookingDate = new Date(bookingDate);
  formattedBookingDate.setHours(0, 0, 0, 0);
  console.log('--------------------------campaignId', campaignId)
  console.log('--------------------------formattedBookingDate', formattedBookingDate)
  console.log('--------------------------slotInput', slotInput)
  const fetchBatchRes = await callLocalGraphqlApi(fetchBatch(campaignId, formattedBookingDate.toISOString(), slotInput));
  console.log('--------------------------fetchBatchRes', fetchBatchRes)
  const batchId = get(fetchBatchRes, 'data.batches[0].id', '');
  const maxBatchSize = get(fetchBatchRes, 'data.batches[0].campaign.batchRules.batchSize', 1);
  const studentsMeta = get(fetchBatchRes, 'data.batches[0].studentsMeta.count', 0);

  if (studentsMeta >= maxBatchSize) {
    throw new BatchFullError();
  }

  if (batchId) {
    const fetchBatchForStudentRes = await callLocalGraphqlApi(fetchBatchForStudent(studentProfileId));
    const batchIdForStudent = get(fetchBatchForStudentRes, 'data.batches[0].id', '');
    console.log('------------------------------batchIdForStudent', batchIdForStudent)
    console.log('------------------------------studentProfileId', studentProfileId)
    // if student is already attached to a batch, disconnect it
    if (batchIdForStudent) {
      await callLocalGraphqlApi(removeStudentFromBatch(batchIdForStudent, studentProfileId));
    }

    // add student to the new batch
    await callLocalGraphqlApi(updateBatch(batchIdForStudent, studentProfileId));
  }

  return {
    result: true,
  };
};

export default bookB2B2CSlotsMutationResolver;

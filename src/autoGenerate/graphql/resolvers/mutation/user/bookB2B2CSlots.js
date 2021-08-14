import { get } from 'lodash';
import validateAuthentication from '../../../../../../utils/validateAuthentication';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import getSelectedSlotsTime from '../../../preHookFunctions/validation/utils/getSelectedSlotsTime';
import { NoSlotSelectedError, OnlyOneSlotAllowedError } from '../../../../../../constants/errors/input';
import { BatchFullError, DatabaseRecordNotFoundError } from '../../../../../../constants/errors';
import { addMenteeBookingLeadsquared } from '../../../postHookFunctions/leadsquared';

// query to fetch student profile id on basis of user id
const fetchUser = (userId) => `
  query{
    user(id: "${userId}"){
      id
      studentProfile {
        id
        parents {
          user {
            id
            phone {
              number
              countryCode
            }
          }
        }
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
const updateBatch = (batchId, studentId, courseId) => `
  mutation{
    updateBatch(id:"${batchId}", ${courseId ? `courseConnectId: "${courseId}"` : ''} studentsConnectIds: ["${studentId}"], input:{}){
      id
      course{
        id
      }
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

const fetchMentor = (batchId) => `
  {
    batchSessions(filter: {
      batch_some: { id: "${batchId}" }
    })  {
      id
      mentorSession{
        user{
          mentorProfile{
            googleMeetLink
            sessionLink
          }
        }
      }
    }
  }
`;

const addMenteeToLS = async (phone, bookingDate, slots, batchId) => {
  const res = await callLocalGraphqlApi(fetchMentor(batchId));
  const { sessionLink, googleMeetLink } = get(res, 'data.batchSessions[0].mentorSession.user.mentorProfile', {}) || {};
  const meetingLink = googleMeetLink || sessionLink;
  await addMenteeBookingLeadsquared({
    phone,
    bookingDate,
    slot: get(getSelectedSlotsTime(slots), '0', ''),
    sessionLink: meetingLink,
    type: 'b2b2c',
  }, {}, [], {}, {}, true);
};

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
      courseId,
      campaignId,
      userId,
      bookingDate,
      ...slots
    },
  } = params;
  context.isBookedByMentee = true;
  const slotTimeArray = getSelectedSlotsTime(slots);
  if (!slotTimeArray.length) {
    throw new NoSlotSelectedError();
  } else if (slotTimeArray.length > 1) {
    throw new OnlyOneSlotAllowedError();
  }

  const fetchUserRes = await callLocalGraphqlApi(fetchUser(userId));
  const studentProfileId = get(fetchUserRes, 'data.user.studentProfile.id', '');
  const phone = get(fetchUserRes, 'data.user.studentProfile.parents[0].user.phone.number', '');
  if (!studentProfileId) {
    throw new DatabaseRecordNotFoundError();
  }

  // fetch batch on the basis of campaign and slots
  const slotInput = `b2b2ctimeTable_slot${slotTimeArray[0]}_subDoc`;
  const formattedBookingDate = new Date(bookingDate);
  formattedBookingDate.setHours(0, 0, 0, 0);
  const fetchBatchRes = await callLocalGraphqlApi(fetchBatch(campaignId, formattedBookingDate.toISOString(), slotInput));
  const batches = get(fetchBatchRes, 'data.batches', '');
  let batchId = '';
  if (batches && batches.length) {
    // iterating over each batch for that particular booking date and slot
    // if there are multiple batches and there n students in any of the batches
    // we will randomly choose one otherwise choose which is partially full
    // and if one is full, and other have 0 students, again choose randomly

    // iterating over each batch here to find partially filled batch
    batches.forEach((batch) => {
      if (batch && batch.id) {
        const batchSize = get(batch, 'campaign.batchRules.batchSize', 1);
        const studentsMeta = get(batch, 'studentsMeta.count', 0);
        if (!batchId && studentsMeta < batchSize && studentsMeta > 0) {
          batchId = batch.id;
        }
      }
    });

    // if we do not get a batch id uptil here, that means either the batch has 0 students
    // or students equal to batchSize
    // so here we will randomly choose a batch with 0 students
    if (!batchId) {
      batches.forEach((batch) => {
        if (batch && batch.id) {
          const batchSize = get(batch, 'campaign.batchRules.batchSize', 1);
          const studentsMeta = get(batch, 'studentsMeta.count', 0);
          if (!batchId && studentsMeta < batchSize && studentsMeta === 0) {
            batchId = batch.id;
          }
        }
      });
    }
  }

  // if we don't get a batchId until now, that means all batches are full
  if (!batchId) {
    throw new BatchFullError();
  }
  if (batchId) {
    const fetchBatchForStudentRes = await callLocalGraphqlApi(fetchBatchForStudent(studentProfileId));
    const batchIdForStudent = get(fetchBatchForStudentRes, 'data.batches[0].id', '');
    // if student is already attached to a batch, disconnect it
    if (batchIdForStudent) {
      await callLocalGraphqlApi(removeStudentFromBatch(batchIdForStudent, studentProfileId));
    }

    // add student to the new batch
    await callLocalGraphqlApi(updateBatch(batchId, studentProfileId, courseId), context);
    addMenteeToLS(phone, bookingDate, slots, batchId);
  }
  return {
    result: true,
  };
};

export default bookB2B2CSlotsMutationResolver;

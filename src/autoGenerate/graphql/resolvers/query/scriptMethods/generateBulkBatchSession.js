/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
import get from 'lodash/get';
import moment from 'moment';
import { log } from '../../../../../../utils';
import getSlotTimesInString from '../../../../../../utils/getSlotTimesInString';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import getSelectedSlotsTime from '../../../preHookFunctions/validation/utils/getSelectedSlotsTime';

const getBatchDetails = async (batchCode) => {
  const batchQuery = `{
  batches(filter: { code: "${batchCode}" }) {
    id
    type
    allottedMentor {
      id
    }
    currentComponent {
      id
      currentCourse {
        id
        title
        topics(filter:{status:published}, orderBy: order_ASC){
            id
            order
            title
        }
      }
      currentTopic {
        id
        order
        title
      }
    }
  }
}
`;
  const result = await callLocalGraphqlApi(batchQuery);
  return get(result, 'data.batches[0]', null);
};

const getMentorSession = async (userId, availabilityDate, sessionType) => {
  const mentorSessionQuery = `{
    mentorSessions(filter:{
    and:[
      {
        user_some:{id:"${userId}"}
      }
      {
        availabilityDate:"${availabilityDate}"
      }
      ${sessionType ? `{sessionType:${sessionType}}` : '{sessionType:batch}'}
    ]
  }){
    id
    ${getSlotTimesInString()}
  }
  }`;
  const mentorSessionRes = await callLocalGraphqlApi(mentorSessionQuery);
  return get(mentorSessionRes, 'data.mentorSessions[0]', null);
};

const getBatchSession = async (batchId, topicId) => {
  const batchSessionQuery = `{
  batchSessions(filter:{and:[
    {
      batch_some:{
        id:"${batchId}"
      }
    }
    {
      topic_some:{
        id:"${topicId}"
      }
    }
  ]}){
    id
  }
}`;
  const batchSessionRes = await callLocalGraphqlApi(batchSessionQuery);
  return get(batchSessionRes, 'data.batchSessions', []).length;
};

const addMentorSession = async (userId, courseId, input) => {
  const addMentorSessionQuery = `mutation ($input: MentorSessionInput!) {
  addMentorSession(input: $input,
    userConnectId: "${userId}",
    ${courseId ? `courseConnectId: "${courseId}"` : ''}
  ) {
    id
  }
}`;
  const addMentorSessionRes = await callLocalGraphqlApi(addMentorSessionQuery, '', { input });
  return get(addMentorSessionRes, 'data.addMentorSession.id');
};

const updateMentorSession = async (mentorSessionId, courseId, input) => {
  const updateMentorSessionQuery = `mutation($input: MentorSessionUpdate){
  updateMentorSession(
    id:"${mentorSessionId}",
    ${courseId ? `courseConnectId: "${courseId}"` : ''}
    input:$input
  ){
    id
  }
}`;
  const updateMentorSessionRes = await callLocalGraphqlApi(updateMentorSessionQuery, '', { input });
  return get(updateMentorSessionRes, 'data.updateMentorSession.id');
};

const addBatchSession = async (batchId, topicId, mentorSessionId, courseId, input) => {
  const addBatchSessionQuery = `mutation ($input: BatchSessionInput!) {
   addBatchSession(input: $input, 
    batchConnectId: "${batchId}",
    topicConnectId: "${topicId}",
    mentorSessionConnectId:"${mentorSessionId}",
    ${courseId ? `courseConnectId: "${courseId}"` : ''}
    ) {
     id
   }
 }`;
  const addBatchSessionRes = await callLocalGraphqlApi(addBatchSessionQuery, '', { input });
  return get(addBatchSessionRes, 'data.addBatchSession.id');
};
// Before running this script, get the batchSessions data that needs to be created
// Format for the batchSession data is below
const generateBulkBatchSession = async () => {
  const batchesData = [
    // {
    //   batchCode: 'TK-A3402',
    //   bookingDate: '25-Jun-22',
    //   slotTime: 18,
    //   topicOrder: 37,
    //   topicTitle: 'Break & Continue - I',
    // },
  ];
  // const batchId = get(batchDetails, 'id');
  // const batchType = get(batchDetails, 'type');
  const groupedBatchSessions = batchesData.reduce((accumulator, currentValue) => {
    accumulator[get(currentValue, 'batchCode')] = accumulator[get(currentValue, 'batchCode')] || [];
    accumulator[get(currentValue, 'batchCode')].push(currentValue);
    return accumulator;
  }, {});
  const createdBatchSessionIds = [];
  for (const batchCode in groupedBatchSessions) {
    const batchDetails = await getBatchDetails(batchCode);
    const allottedMentorId = get(batchDetails, 'allottedMentor.id');
    const batchCurrentCourseId = get(batchDetails, 'currentComponent.currentCourse.id');
    const batchId = get(batchDetails, 'id');
    const batchType = get(batchDetails, 'type');
    if (batchType !== 'b2b') {
      const topics = get(batchDetails, 'currentComponent.currentCourse.topics', []);
      const batchSessionsData = groupedBatchSessions[batchCode];
      for (const batchSession of batchSessionsData) {
        const topicDetail = topics.find((topic) => get(topic, 'title') === batchSession.topicTitle && get(topic, 'order') === batchSession.topicOrder);
        const bookingDate = moment(batchSession.bookingDate).startOf('day').toISOString();
        const topicId = get(topicDetail, 'id');
        const isBatchSessionExists = await getBatchSession(batchId, topicId);
        if (!isBatchSessionExists && moment().isBefore(bookingDate)) {
          let sessionType = '';
          if (batchType === 'b2b2c' && get(topicDetail, 'order') === 1) sessionType = 'trial';
          else sessionType = 'batch';
          const mentorSessionResponse = await getMentorSession(allottedMentorId, bookingDate, sessionType);
          const mentorSessionInput = {
            availabilityDate: bookingDate,
            sessionType,
          };
          const batchSessionInput = {
            bookingDate,
          };
          batchSessionInput[`slot${batchSession.slotTime}`] = true;
          if (mentorSessionResponse) {
            const slotTimeArray = getSelectedSlotsTime(mentorSessionResponse);
            const mentorSessionId = get(mentorSessionResponse, 'id');
            if (slotTimeArray.includes(batchSession.slotTime)) {
              const createdBatchSessionId = await addBatchSession(batchId, topicId, mentorSessionId, batchCurrentCourseId, batchSessionInput);
              log(`Created BatchSession ${createdBatchSessionId} for batch : ${batchCode} with topic: ${topicId} and course ${batchCurrentCourseId}`);
              createdBatchSessionIds.push(createdBatchSessionId);
            } else {
              mentorSessionInput[`slot${batchSession.slotTime}`] = true;
              const updatedMentorSessionId = await updateMentorSession(mentorSessionId, batchCurrentCourseId, mentorSessionInput);
              log(`Updated MentorSession: ${updatedMentorSessionId}`);
              const createdBatchSessionId = await addBatchSession(batchId, topicId, mentorSessionId, batchCurrentCourseId, batchSessionInput);
              log(`Created BatchSession ${createdBatchSessionId} for batch : ${batchCode} with topic: ${topicId} and course ${batchCurrentCourseId}`);
              createdBatchSessionIds.push(createdBatchSessionId);
            }
          } else {
            mentorSessionInput[`slot${batchSession.slotTime}`] = true;
            const mentorSessionId = await addMentorSession(allottedMentorId, batchCurrentCourseId, mentorSessionInput);
            log(`Added MentorSession: ${mentorSessionId}`);
            const createdBatchSessionId = await addBatchSession(batchId, topicId, mentorSessionId, batchCurrentCourseId, batchSessionInput);
            log(`Created BatchSession ${createdBatchSessionId} for batch : ${batchCode} with topic: ${topicId} and course ${batchCurrentCourseId}`);
            createdBatchSessionIds.push(createdBatchSessionId);
          }
        }
      }
    }
  }
  console.log('Created BatchSessions', JSON.stringify(createdBatchSessionIds));
  console.log('Created All batchSessions successfully', createdBatchSessionIds.length, batchesData.length, createdBatchSessionIds.length === batchesData.length);
};

export default generateBulkBatchSession;

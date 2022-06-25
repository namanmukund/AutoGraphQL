import get from 'lodash/get';
import getSlotTimesInString from '../../../../../../utils/getSlotTimesInString';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

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

const getBatchSessionForBatch = async (batchId) => {
  const batchSessionQuery = `{
  batchSessions(filter:{batch_some:{id:"${batchId}"}}, orderBy:bookingDate_DESC, first:1){
    id
    topic{
        id
        order
        title
    }
  }
}
`;
  const batchSessionRes = await callLocalGraphqlApi(batchSessionQuery);
  return get(batchSessionRes, 'data.batchSessions', []);
};

const getMentorSession = async (userId, availabilityDate) => {
  const mentorSessionQuery = `mentorSessions(filter:{
    and:[
      {
        user_some:{id:"${userId}"}
      }
      {
        availabilityDate:"${availabilityDate}"
      }
    ]
  }){
    id
    ${getSlotTimesInString()}
  }`;
  const mentorSessionRes = await callLocalGraphqlApi(mentorSessionQuery);
  return get(mentorSessionRes, 'data.mentorSessions[0].id', null);
};

const addMentorSession = async (userId, courseId, input) => {
  const addMentorSessionQuery = `mutation addmentorsession ($input: MentorSessionInput!) {
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

const generateBulkBatchSession = async () => {
  const batchesData = [
    {
      batchCode: 'TK-A3402',
      bookingDate: '25-Jun-22',
      slotTime: 18,
      topicOrder: 37,
      topicTitle: 'Break & Continue - I',
    },
    {
      batchCode: 'TK-A3402',
      bookingDate: '28-Jun-22',
      slotTime: 16,
      topicOrder: 38,
      topicTitle: 'Break & Continue - II',
    },
    {
      batchCode: 'TK-A3402',
      bookingDate: '02-Jul-22',
      slotTime: 18,
      topicOrder: 39,
      topicTitle: 'Event Registration App - I',
    },
    {
      batchCode: 'TK-A3402',
      bookingDate: '06-Jul-22',
      slotTime: 16,
      topicOrder: 40,
      topicTitle: 'Event Registration App - II',
    },
    {
      batchCode: 'TK-A3362',
      bookingDate: '25-Jun-22',
      slotTime: 11,
      topicOrder: 36,
      topicTitle: 'Nested Loop - II',
    },
    {
      batchCode: 'TK-A3362',
      bookingDate: '27-Jun-22',
      slotTime: 15,
      topicOrder: 37,
      topicTitle: 'Break & Continue - I',
    },
    {
      batchCode: 'TK-A3362',
      bookingDate: '29-Jun-22',
      slotTime: 11,
      topicOrder: 38,
      topicTitle: 'Break & Continue - II',
    },
    {
      batchCode: 'TK-A3362',
      bookingDate: '01-Jul-22',
      slotTime: 18,
      topicOrder: 39,
      topicTitle: 'Event Registration App - I',
    },
    {
      batchCode: 'TK-A3362',
      bookingDate: '03-Jul-22',
      slotTime: 20,
      topicOrder: 40,
      topicTitle: 'Event Registration App - II',
    },
    {
      batchCode: 'TK-A3316',
      bookingDate: '25-Jun-22',
      slotTime: 10,
      topicOrder: 14,
      topicTitle: 'Input & Embedding - I',
    },
    {
      batchCode: 'TK-A3316',
      bookingDate: '26-Jun-22',
      slotTime: 12,
      topicOrder: 15,
      topicTitle: 'Input & Embedding - II',
    },
    {
      batchCode: 'TK-A3316',
      bookingDate: '26-Jun-22',
      slotTime: 18,
      topicOrder: 16,
      topicTitle: 'String Indexing - I',
    },
    {
      batchCode: 'TK-A3316',
      bookingDate: '27-Jun-22',
      slotTime: 10,
      topicOrder: 17,
      topicTitle: 'String Indexing - II',
    },
    {
      batchCode: 'TK-A3316',
      bookingDate: '30-Jun-22',
      slotTime: 12,
      topicOrder: 18,
      topicTitle: 'Find & Replace - I',
    },
    {
      batchCode: 'TK-A3429',
      bookingDate: '28-Jun-22',
      slotTime: 20,
      topicOrder: 18,
      topicTitle: 'Find & Replace - I',
    },
    {
      batchCode: 'TK-A3429',
      bookingDate: '30-Jun-22',
      slotTime: 16,
      topicOrder: 19,
      topicTitle: 'Find & Replace - II',
    },
    {
      batchCode: 'TK-A3429',
      bookingDate: '02-Jul-22',
      slotTime: 20,
      topicOrder: 20,
      topicTitle: 'Calculator - I',
    },
    {
      batchCode: 'TK-A3429',
      bookingDate: '04-Jul-22',
      slotTime: 16,
      topicOrder: 21,
      topicTitle: 'Calculator - II',
    },
    {
      batchCode: 'TK-A3429',
      bookingDate: '08-Jul-22',
      slotTime: 20,
      topicOrder: 22,
      topicTitle: 'Conditions: Comparison Operators',
    },
    {
      batchCode: 'TK-A3303',
      bookingDate: '28-Jun-22',
      slotTime: 16,
      topicOrder: 24,
      topicTitle: 'If-Else - I',
    },
    {
      batchCode: 'TK-A3303',
      bookingDate: '30-Jun-22',
      slotTime: 11,
      topicOrder: 25,
      topicTitle: 'If-Else - II',
    },
    {
      batchCode: 'TK-A3303',
      bookingDate: '02-Jul-22',
      slotTime: 15,
      topicOrder: 26,
      topicTitle: 'Nested If-else',
    },
    {
      batchCode: 'TK-A3303',
      bookingDate: '04-Jul-22',
      slotTime: 11,
      topicOrder: 27,
      topicTitle: 'Elif',
    },
    {
      batchCode: 'TK-A3303',
      bookingDate: '08-Jul-22',
      slotTime: 18,
      topicOrder: 28,
      topicTitle: 'Rock Paper Scissors - I',
    },
  ];
  const batchCode = 'TK-A3629';
  const batchDetails = await getBatchDetails(batchCode);
  const batchId = get(batchDetails, 'id');
  const batchType = get(batchDetails, 'type');
  const allottedMentorId = get(batchDetails, 'allottedMentor.id');
  const currentCourseId = get(batchDetails, 'currentComponent.currentCourse.id');
  const topics = get(batchDetails, 'currentComponent.currentCourse.topics', []);
  const batchSession = await getBatchSessionForBatch(batchId);
};

export default generateBulkBatchSession;

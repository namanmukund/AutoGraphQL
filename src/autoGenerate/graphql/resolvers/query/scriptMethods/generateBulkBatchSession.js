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

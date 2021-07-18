import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const addSessionLogQuery = (bookingDate, slot, clientId, topicId, actionByUserId, courseId, action, batchCode, mentorId, sessionStatus, mentorAvailabilityDate) => `
  mutation{
    addSessionLog(
        ${clientId ? `clientConnectId:"${clientId}"` : ''}
        ${courseId ? `courseConnectId:"${courseId}"` : ''}
        ${mentorId ? `mentorConnectId:"${mentorId}"` : ''}
        topicConnectId: "${topicId}"
        actionByConnectId: "${actionByUserId}"
        input:{
          action: ${action}
          sessionDate: "${bookingDate}"
          ${slot}:true
          ${sessionStatus ? `sessionStatus: ${sessionStatus}` : ''}
          ${batchCode ? `batchCode: "${batchCode}"` : ''}
          ${mentorAvailabilityDate ? `mentorAvailabilityDate: "${mentorAvailabilityDate}"` : ''}
        }
    ){
      id
    }
  }
`;

// query to get mentor Sessions
const getMentorSession = (mentorSessionId) => `query{
  mentorSession(id: "${mentorSessionId}"){
    id
    availabilityDate
    user{
      id
    }
  }
}
  `;

// query to get topic
const getTopic = (topicId) => `query{
  topic(id: "${topicId}"){
    id
    order
  }
}
  `;

const addSessionLog = async (
  bookingDate, slotTimeStringArray, clientId, topicId, currentUser, courseId, action, batchCode, mentorSessionId, sessionStatus,
) => {
  const slot = slotTimeStringArray && slotTimeStringArray.length ? slotTimeStringArray[0] : '';
  const actionByUserId = currentUser && currentUser.id;
  let mentorId = '';
  let mentorAvailabilityDate = '';
  let topicOrder = 0;
  if (mentorSessionId) {
    const getMentorSessionRes = await callLocalGraphqlApi(
      getMentorSession(
        mentorSessionId,
      ),
    );
    mentorId = get(getMentorSessionRes, 'data.mentorSession.user.id', '');
    mentorAvailabilityDate = get(getMentorSessionRes, 'data.mentorSession.availabilityDate', '');
  }

  if (topicId) {
    const getTopicRes = await callLocalGraphqlApi(
      getTopic(
        topicId,
      ),
    );
    topicOrder = get(getTopicRes, 'data.topic.order', 0);
  }
  if (topicOrder === 1 && actionByUserId) {
    callLocalGraphqlApi(addSessionLogQuery(
      bookingDate, slot, clientId, topicId, actionByUserId, courseId, action, batchCode, mentorId, sessionStatus, mentorAvailabilityDate,
    ));
  }
};

export default addSessionLog;

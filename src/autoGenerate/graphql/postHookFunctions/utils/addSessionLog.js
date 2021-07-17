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

const addSessionLog = async (
  bookingDate, slotTimeStringArray, clientId, topicId, currentUser, courseId, action, batchCode, mentorSessionId, sessionStatus,
) => {
  const slot = slotTimeStringArray && slotTimeStringArray.length ? slotTimeStringArray[0] : '';
  const actionByUserId = currentUser && currentUser.id;
  let mentorId = '';
  let mentorAvailabilityDate = '';
  if (mentorSessionId) {
    const getMentorSessionRes = await callLocalGraphqlApi(
      getMentorSession(
        mentorSessionId,
      ),
    );
    mentorId = get(getMentorSessionRes, 'data.mentorSession.user.id', '');
    mentorAvailabilityDate = get(getMentorSessionRes, 'data.mentorSession.availabilityDate', '');
  }
  console.log('-----------------------------------------bookingDate', bookingDate);
  console.log('-----------------------------------------slot', slot);
  console.log('-----------------------------------------clientId', clientId);
  console.log('-----------------------------------------topicId', topicId);
  console.log('-----------------------------------------actionByUserId', actionByUserId);
  console.log('-----------------------------------------courseId', courseId);
  console.log('-----------------------------------------action', action);
  console.log('-----------------------------------------batchCode', batchCode);
  console.log('-----------------------------------------mentorId', mentorId);
  console.log('-----------------------------------------sessionStatus', sessionStatus);
  console.log('-----------------------------------------mentorAvailabilityDate', mentorAvailabilityDate);

  callLocalGraphqlApi(addSessionLogQuery(
    bookingDate, slot, clientId, topicId, actionByUserId, courseId, action, batchCode, mentorId, sessionStatus, mentorAvailabilityDate,
  ));
};

export default addSessionLog;

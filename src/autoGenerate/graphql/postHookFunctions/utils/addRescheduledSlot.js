import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const addRescheduledSlotQuery = (fromDate, fromSlot, toDate, toSlot, batchSessionId, mentorMenteeSessionId) => `
  mutation{
    addRescheduledSlot(
      ${batchSessionId ? `batchSessionConnectId:"${batchSessionId}"` : ''}
      ${mentorMenteeSessionId ? `mentorMenteeSessionConnectId:"${mentorMenteeSessionId}"` : ''}
      input: {
        oldSessionTime:{
          sessionDate: "${fromDate}",
          ${fromSlot}: true
        },
        newSessionTime:{
          sessionDate: "${toSlot}",
          ${toSlot}: true
        }
      }
    ){
      id
    }
  }
`;

const addRescheduledSlot = (
  fromDate, fromSlot, toDate, toSlot, batchSessionId, mentorMenteeSessionId,
) => {
  callLocalGraphqlApi(addRescheduledSlotQuery(
    fromDate, fromSlot, toDate, toSlot, batchSessionId, mentorMenteeSessionId,
  ));
};

export default addRescheduledSlot;

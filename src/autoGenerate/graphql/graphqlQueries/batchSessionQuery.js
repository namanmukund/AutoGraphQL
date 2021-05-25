import getSlotTimesInString from '../../../../utils/getSlotTimesInString';

const batchSessionQuery = (batchSessionId) => `
query{
  batchSession(id:"${batchSessionId}"){
    id
    bookingDate
    topic{id order}
    ${getSlotTimesInString()}
    batch{
      id
      allottedMentor{
        id
      }
    }
    sessionStatus
    mentorSession{
      id
    }
  }
}
`;

export default batchSessionQuery;

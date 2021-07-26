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
      code
      allottedMentor{
        id
      }
    }
    sessionStatus
    mentorSession{
      id
    }
    course{
        id
    }
  }
}
`;

export default batchSessionQuery;

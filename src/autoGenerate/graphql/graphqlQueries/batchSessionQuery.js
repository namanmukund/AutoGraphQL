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
    }
    sessionStatus
  }
}
`;

export default batchSessionQuery;

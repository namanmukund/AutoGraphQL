import getSlotTimesInString from '../../../../utils/getSlotTimesInString';

const menteeSessionQuery = (menteeSessionId) => `
query{
  menteeSession(id:"${menteeSessionId}"){
    id
    bookingDate
    topic{id order}
    ${getSlotTimesInString()}
  }
}
`;

export default menteeSessionQuery;

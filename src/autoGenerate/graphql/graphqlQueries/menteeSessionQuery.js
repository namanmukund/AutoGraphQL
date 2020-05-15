import getSlotTimesInString from '../../../../utils/getSlotTimesInString';

const menteeSessionQuery = (menteeSessionId) => `
query{
  menteeSession(id:"${menteeSessionId}"){
    id
    bookingDate
    ${getSlotTimesInString()}
  }
}
`;

export default menteeSessionQuery;

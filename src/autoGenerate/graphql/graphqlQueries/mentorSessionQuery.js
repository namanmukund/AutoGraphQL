import getSlotTimesInString from '../../../../utils/getSlotTimesInString';

const mentorSessionQuery = (mentorSessionId) => `
query{
  mentorSession(id:"${mentorSessionId}"){
    id
    availabilityDate
    ${getSlotTimesInString()}
  }
}`;

export default mentorSessionQuery;

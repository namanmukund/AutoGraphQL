import getSlotTimesInString from '../../../../utils/getSlotTimesInString';

const mentorSessionQuery = (mentorSessionId) => `
query{
  mentorSession(id:"${mentorSessionId}"){
    id
    availabilityDate
    slotType
    ${getSlotTimesInString()}
  }
}`;

export default mentorSessionQuery;

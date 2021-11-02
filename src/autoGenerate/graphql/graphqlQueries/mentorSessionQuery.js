import getSlotTimesInString from '../../../../utils/getSlotTimesInString';

const mentorSessionQuery = (mentorSessionId) => `
query{
  mentorSession(id:"${mentorSessionId}"){
    id
    user{
      id
      mentorProfile{
        id
      }
    }
    availabilityDate
    ${getSlotTimesInString()}
    sessionType
    mentorMenteeSessions{
      id
      menteeSession{
        ${getSlotTimesInString()}
      }
    }
    batchSessions{
      id
      ${getSlotTimesInString()}
    }
  }
}`;

export default mentorSessionQuery;

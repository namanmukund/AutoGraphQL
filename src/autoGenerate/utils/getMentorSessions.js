import getSlotTimesInString from '../../../utils/getSlotTimesInString';

// query to get mentor Sessions
const getMentorSessions = (userId, availabilityDate) => `query{
    mentorSessions(filter:{
      and:[
          {user_some: {id: "${userId}"}},
          {availabilityDate: "${availabilityDate}"}
      ]
    }){
      id
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
  }
  `;

export default getMentorSessions;

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
            user {
              name
            }
            ${getSlotTimesInString()}
          }
        }
        batchSessions{
          id
          batch {
            code
          }
          ${getSlotTimesInString()}
        }
    }
  }
  `;

export default getMentorSessions;

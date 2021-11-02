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
            bookingDate
            user {
              name
              studentProfile {
                batch {
                  code
                }
              }
            }
            ${getSlotTimesInString()}
          }
        }
      batchSessions{
        id
        batch {
          type
          code
          studentsMeta {
            count
          }
        }
        ${getSlotTimesInString()}
      }
      adhocSessions{
        id
        batch {
          type
          code
          studentsMeta {
            count
          }
        }
        ${getSlotTimesInString()}
      }
    }
  }
  `;

export default getMentorSessions;

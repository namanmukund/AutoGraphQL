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
                  id
                  code
                }
              }
            }
            ${getSlotTimesInString()}
          }
        }
      batchSessions{
        id
        startMinutes
        endMinutes
        batch {
          id
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
        startMinutes
        endMinutes
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

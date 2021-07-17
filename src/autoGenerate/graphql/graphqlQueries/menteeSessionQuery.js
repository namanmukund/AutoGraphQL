import getSlotTimesInString from '../../../../utils/getSlotTimesInString';

const menteeSessionQuery = (menteeSessionId) => `
query{
  menteeSession(id:"${menteeSessionId}"){
    id
    bookingDate
    course{id}
    topic{id order}
    ${getSlotTimesInString()}
    user{
      id
      studentProfile{
        parents{
          id
          user{
            id
            phone{
              countryCode
              number
            }
          }
        }
      }
    }
  }
}
`;

export default menteeSessionQuery;
